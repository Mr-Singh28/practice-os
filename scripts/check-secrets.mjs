#!/usr/bin/env node

import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(process.cwd());
const maximumFileSize = 10 * 1024 * 1024;

const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".npm",
  ".npm-cache",
  ".tools",
  ".vercel",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "playwright-report",
  "test-results",
]);

const allowlistedBinaryAssetExtensions = new Set([
  ".avif",
  ".bmp",
  ".eot",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp3",
  ".mp4",
  ".otf",
  ".png",
  ".tif",
  ".tiff",
  ".ttf",
  ".wav",
  ".webm",
  ".webp",
  ".woff",
  ".woff2",
]);

const unscannableContainerExtensions = new Set([
  ".7z",
  ".avi",
  ".class",
  ".db",
  ".dll",
  ".doc",
  ".docx",
  ".exe",
  ".gz",
  ".jar",
  ".pdf",
  ".pyd",
  ".so",
  ".sqlite",
  ".tar",
  ".wasm",
  ".xls",
  ".xlsx",
  ".zip",
]);

const highConfidenceDetectors = [
  {
    id: "private-key-material",
    pattern: /-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY(?: BLOCK)?-----/g,
  },
  {
    id: "github-token",
    pattern: /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g,
  },
  { id: "aws-access-key", pattern: /AKIA[0-9A-Z]{16}/g },
  { id: "google-api-key", pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { id: "live-payment-key", pattern: /sk_live_[0-9A-Za-z]{20,}/g },
  { id: "slack-token", pattern: /xox[baprs]-[0-9A-Za-z-]{20,}/g },
];

const secretAssignmentPattern =
  /\b([A-Z][A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|AUTH_TOKEN|SECRET|PASSWORD|PRIVATE_KEY|SERVICE_ROLE_KEY|DB_PASSWORD))\b\s*[:=]\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^\s,#}\r\n]+))/g;

const credentialUrlPattern =
  /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^/\s:@]+:([^@\s/]+)@/gi;

function normalisePath(filePath) {
  return relative(projectRoot, filePath).split(sep).join("/");
}

function isInsideProject(filePath) {
  const absolutePath = resolve(filePath);
  return (
    absolutePath === projectRoot || absolutePath.startsWith(`${projectRoot}${sep}`)
  );
}

function isIgnoredLocalEnvironmentFile(relativePath) {
  const name = relativePath.split("/").at(-1) ?? "";
  return name === ".env.local" || /^\.env\..+\.local$/i.test(name);
}

function listFilesWithGit() {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: projectRoot,
      encoding: "buffer",
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
    },
  );

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  return result.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((filePath) => resolve(projectRoot, filePath));
}

function listFilesRecursively(directory = projectRoot) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      continue;
    }

    const absolutePath = resolve(directory, entry.name);
    const relativePath = normalisePath(absolutePath);

    if (entry.isDirectory()) {
      if (
        ignoredDirectories.has(entry.name) ||
        relativePath === "supabase/.branches" ||
        relativePath === "supabase/.temp"
      ) {
        continue;
      }
      files.push(...listFilesRecursively(absolutePath));
      continue;
    }

    if (entry.isFile() && !isIgnoredLocalEnvironmentFile(relativePath)) {
      files.push(absolutePath);
    }
  }

  return files;
}

function hasExtension(filePath, extensions) {
  const lowerPath = filePath.toLowerCase();
  for (const extension of extensions) {
    if (lowerPath.endsWith(extension)) {
      return true;
    }
  }
  return false;
}

function lineNumberAt(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) {
      line += 1;
    }
  }
  return line;
}

function isSafePlaceholder(rawValue, { quoted = true, relativePath = "" } = {}) {
  const value = rawValue.trim().replace(/[;,]$/, "");
  const isCodeFile = /\.(?:c|m)?jsx?$|\.(?:c|m)?tsx?$/i.test(relativePath);

  if (!value || /^(?:false|null|true|undefined)$/i.test(value)) {
    return true;
  }
  if (/^<[^>]+>$/.test(value)) {
    return true;
  }
  if (/^\$\{\{?.+\}\}?$/.test(value)) {
    return true;
  }
  if (/^(?:process\.env|import\.meta\.env)\.[A-Z0-9_]+$/.test(value)) {
    return true;
  }
  if (
    /^(?:change|replace)[-_]?me(?:[-_].*)?$/i.test(value) ||
    /^(?:dummy|example|fake|placeholder|sample|test)(?:[-_].*)?$/i.test(value) ||
    /(?:^|[-_.])(?:dummy|example|fake|placeholder|sample)(?:$|[-_.])/i.test(value) ||
    /^(?:secret|sensitive)[-_]?value(?:[-_].*)?$/i.test(value) ||
    /^(?:server|role)[-_](?:secret|sensitive)[-_]value$/i.test(value)
  ) {
    return true;
  }
  if (
    isCodeFile &&
    !quoted &&
    (/^(?:boolean|number|string|unknown)(?:\[\])?(?:[|;].*)?$/.test(value) ||
      /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(value) ||
      /^(?:Boolean|Number|String)\([A-Za-z_$][\w$.]*\)$/.test(value))
  ) {
    return true;
  }

  return false;
}

function recordMatches(text, relativePath, findings) {
  for (const detector of highConfidenceDetectors) {
    detector.pattern.lastIndex = 0;
    for (const match of text.matchAll(detector.pattern)) {
      findings.push({
        file: relativePath,
        line: lineNumberAt(text, match.index ?? 0),
        detector: detector.id,
      });
    }
  }

  secretAssignmentPattern.lastIndex = 0;
  for (const match of text.matchAll(secretAssignmentPattern)) {
    const variableName = match[1];
    const value = match[2] ?? match[3] ?? match[4] ?? "";
    const quoted = match[2] !== undefined || match[3] !== undefined;
    if (!isSafePlaceholder(value, { quoted, relativePath })) {
      findings.push({
        file: relativePath,
        line: lineNumberAt(text, match.index ?? 0),
        detector: `literal-secret-assignment:${variableName}`,
      });
    }
  }

  credentialUrlPattern.lastIndex = 0;
  for (const match of text.matchAll(credentialUrlPattern)) {
    const password = match[1] ?? "";
    if (!isSafePlaceholder(password, { relativePath })) {
      findings.push({
        file: relativePath,
        line: lineNumberAt(text, match.index ?? 0),
        detector: "credential-bearing-database-url",
      });
    }
  }
}

const candidates = [...new Set(listFilesWithGit() ?? listFilesRecursively())]
  .filter(isInsideProject)
  .sort((left, right) => left.localeCompare(right));

const findings = [];
let checkedFiles = 0;
let allowlistedBinaryFiles = 0;

for (const filePath of candidates) {
  const relativePath = normalisePath(filePath);

  if (hasExtension(filePath, allowlistedBinaryAssetExtensions)) {
    allowlistedBinaryFiles += 1;
    continue;
  }
  if (hasExtension(filePath, unscannableContainerExtensions)) {
    findings.push({
      file: relativePath,
      line: null,
      detector: "unscannable-container-requires-review",
    });
    continue;
  }

  let stats;
  try {
    stats = lstatSync(filePath);
  } catch {
    findings.push({ file: relativePath, line: null, detector: "unreadable-file" });
    continue;
  }

  if (stats.isSymbolicLink()) {
    findings.push({ file: relativePath, line: null, detector: "symlink-not-scanned" });
    continue;
  }
  if (!stats.isFile()) {
    continue;
  }
  if (stats.size > maximumFileSize) {
    findings.push({
      file: relativePath,
      line: null,
      detector: "file-too-large-to-scan",
    });
    continue;
  }

  const buffer = readFileSync(filePath);
  if (buffer.includes(0)) {
    findings.push({
      file: relativePath,
      line: null,
      detector: "binary-or-nul-file-not-scanned",
    });
    continue;
  }

  checkedFiles += 1;
  recordMatches(buffer.toString("utf8"), relativePath, findings);
}

if (findings.length > 0) {
  console.error(
    `Secret scan failed: ${findings.length} high-confidence or unscanned finding(s).`,
  );
  for (const finding of findings) {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    console.error(`- ${location} [${finding.detector}]`);
  }
  console.error(
    "Values are intentionally suppressed. Remove placeholders that resemble real credentials; rotate any real credential before continuing.",
  );
  process.exitCode = 1;
} else {
  console.log(
    `Secret scan passed: ${checkedFiles} project file(s) checked and ${allowlistedBinaryFiles} static binary asset(s) explicitly allowlisted; no high-confidence secret patterns found.`,
  );
}
