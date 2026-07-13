#!/usr/bin/env node

const allowedEnvironments = new Set([
  "local",
  "development",
  "preview",
  "staging",
  "production",
]);

const maximumResponseBytes = 1024 * 1024;
const sensitiveKeyPattern =
  /(?:api[_-]?key|access[_-]?token|auth[_-]?token|secret|password|private[_-]?key|service[_-]?role)/i;
const highConfidenceSecretPattern =
  /(?:-----BEGIN (?:EC |OPENSSH |PGP |RSA )?PRIVATE KEY(?: BLOCK)?-----|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|sk_live_[0-9A-Za-z]{20,}|xox[baprs]-[0-9A-Za-z-]{20,})/;

class VerificationError extends Error {}

function fail(message) {
  throw new VerificationError(message);
}

function nextArgument(argv, index, optionName) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    fail(`${optionName} requires a value.`);
  }
  return value;
}

function parseArguments(argv) {
  const options = {
    environment: "local",
    targetUrl: undefined,
    timeoutMs: 10_000,
    allowProduction: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--environment") {
      options.environment = nextArgument(argv, index, argument).toLowerCase();
      index += 1;
    } else if (argument === "--url") {
      options.targetUrl = nextArgument(argv, index, argument);
      index += 1;
    } else if (argument === "--timeout-ms") {
      const rawTimeout = nextArgument(argv, index, argument);
      const parsedTimeout = Number.parseInt(rawTimeout, 10);
      if (
        !Number.isInteger(parsedTimeout) ||
        parsedTimeout < 1_000 ||
        parsedTimeout > 60_000
      ) {
        fail("--timeout-ms must be an integer between 1000 and 60000.");
      }
      options.timeoutMs = parsedTimeout;
      index += 1;
    } else if (argument === "--allow-production") {
      options.allowProduction = true;
    } else {
      fail("An unknown command-line option was supplied.");
    }
  }

  if (!allowedEnvironments.has(options.environment)) {
    fail("--environment must name a supported non-secret application environment.");
  }
  if (options.environment === "production" && !options.allowProduction) {
    fail(
      "Production verification is disabled by default. A separately approved read-only run must add --allow-production.",
    );
  }

  return options;
}

function isLoopbackHostname(hostname) {
  const normalised = hostname.toLowerCase();
  return (
    normalised === "localhost" || normalised === "127.0.0.1" || normalised === "[::1]"
  );
}

function resolveTarget(options) {
  const suppliedTarget =
    options.targetUrl ??
    process.env.DEPLOYMENT_URL ??
    (options.environment === "local" ? "http://127.0.0.1:3000" : undefined);

  if (!suppliedTarget) {
    fail("A target must be supplied with --url or the DEPLOYMENT_URL variable.");
  }

  let target;
  try {
    target = new URL(suppliedTarget);
  } catch {
    fail("The deployment target is not a valid absolute URL.");
  }

  if (target.username || target.password) {
    fail("Credential-bearing deployment URLs are not allowed.");
  }
  if (options.environment === "local") {
    if (
      !isLoopbackHostname(target.hostname) ||
      !["http:", "https:"].includes(target.protocol)
    ) {
      fail("Local verification is restricted to a loopback HTTP or HTTPS target.");
    }
  } else if (target.protocol !== "https:") {
    fail("Non-local deployment verification requires HTTPS.");
  }

  target.hash = "";
  target.search = "";
  return target;
}

function assertDeclaredResponseSize(response) {
  const declaredLength = Number.parseInt(
    response.headers.get("content-length") ?? "0",
    10,
  );
  if (Number.isFinite(declaredLength) && declaredLength > maximumResponseBytes) {
    fail("A verification response exceeded the safe size limit.");
  }
}

async function readResponseBody(response) {
  assertDeclaredResponseSize(response);
  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    let result;
    try {
      result = await reader.read();
    } catch {
      fail("A verification response could not be read.");
    }

    if (result.done) {
      break;
    }
    totalBytes += result.value.byteLength;
    if (totalBytes > maximumResponseBytes) {
      try {
        await reader.cancel();
      } catch {
        // The response is already being rejected; cancellation is best effort.
      }
      fail("A verification response exceeded the safe size limit.");
    }
    chunks.push(Buffer.from(result.value));
  }

  return Buffer.concat(chunks, totalBytes).toString("utf8");
}

async function readEndpoint(target, path, accept, timeoutMs) {
  let response;
  try {
    response = await fetch(new URL(path, target), {
      method: "GET",
      headers: { accept },
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    fail("A read-only verification request could not be completed.");
  }

  if (response.status >= 300 && response.status < 400) {
    fail("A verification endpoint returned a redirect; redirects are not followed.");
  }
  if (!response.ok) {
    fail("A verification endpoint returned a non-success status.");
  }

  let body;
  try {
    body = await readResponseBody(response);
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }
    fail("A verification response could not be read.");
  }
  return { response, body };
}

function containsSensitiveString(
  value,
  key = "",
  seen = new Set(),
  sensitiveAncestor = false,
) {
  const beneathSensitiveKey = sensitiveAncestor || sensitiveKeyPattern.test(key);

  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string") {
    return beneathSensitiveKey && value.length > 0;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((entry) =>
      containsSensitiveString(entry, "", seen, beneathSensitiveKey),
    );
  }

  return Object.entries(value).some(([entryKey, entryValue]) =>
    containsSensitiveString(entryValue, entryKey, seen, beneathSensitiveKey),
  );
}

async function verifyHomepage(target, options) {
  const { response, body } = await readEndpoint(
    target,
    "/",
    "text/html,application/xhtml+xml",
    options.timeoutMs,
  );
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("text/html")) {
    fail("The homepage did not return HTML.");
  }
  if (!/Practice\s+OS/i.test(body)) {
    fail("The homepage did not contain the expected foundation marker.");
  }
  if (!new RegExp(`\\b${options.environment}\\b`, "i").test(body)) {
    fail("The homepage did not contain the expected environment marker.");
  }
  if (highConfidenceSecretPattern.test(body)) {
    fail("The homepage contained a high-confidence secret pattern.");
  }

  console.log("PASS homepage: safe foundation and environment markers were present.");
}

async function verifyReadiness(target, options) {
  const { response, body } = await readEndpoint(
    target,
    "/api/readiness",
    "application/json",
    options.timeoutMs,
  );
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    fail("The readiness endpoint did not return JSON.");
  }

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    fail("The readiness endpoint returned invalid JSON.");
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    fail("The readiness endpoint returned an invalid payload shape.");
  }
  if (payload.status !== "ready") {
    fail("The readiness endpoint did not report ready status.");
  }
  if (payload.environment !== options.environment) {
    fail("The readiness environment did not match the requested environment.");
  }
  if (options.environment !== "local" && payload.limitedMode !== false) {
    fail("A hosted environment reported limited local mode.");
  }
  if (containsSensitiveString(payload) || highConfidenceSecretPattern.test(body)) {
    fail("The readiness endpoint contained a secret-like string value.");
  }

  console.log("PASS readiness: safe ready payload matched the requested environment.");
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const target = resolveTarget(options);

  console.log(`Starting read-only deployment verification for ${options.environment}.`);
  await verifyHomepage(target, options);
  await verifyReadiness(target, options);
  console.log(`Deployment verification passed for ${options.environment}.`);
}

try {
  await main();
} catch (error) {
  if (error instanceof VerificationError) {
    console.error(`Deployment verification failed: ${error.message}`);
  } else {
    console.error(
      "Deployment verification failed because of an unexpected local error. Target and response values are suppressed.",
    );
  }
  process.exitCode = 1;
}
