import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findRepositorySupabaseBinary } from "./lib/supabase-cli.mjs";

const BLOCKED_EXIT_CODE = 2;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const supabaseDirectory = join(repositoryRoot, "supabase");
const migrationDirectory = join(supabaseDirectory, "migrations");
const testDirectory = join(supabaseDirectory, "tests");

function report(status, message) {
  console.log(`[${status}] ${message}`);
}

function stop(status, message, exitCode) {
  report(status, message);
  process.exit(exitCode);
}

function run(command, args, timeout = 30_000) {
  const needsShell =
    process.platform === "win32" &&
    (command === "supabase" || command.endsWith(".cmd"));

  return spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    shell: needsShell,
    timeout,
    windowsHide: true,
  });
}

function commandUnavailable(result) {
  return result.error?.code === "ENOENT";
}

function commandTimedOut(result) {
  return result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM";
}

function capturedText(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`.toLowerCase();
}

function assertFoundationFiles() {
  const requiredFiles = [
    join(supabaseDirectory, "config.toml"),
    join(supabaseDirectory, "seed.sql"),
    join(testDirectory, "0001_foundation.sql"),
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      stop("FAIL", `Required Supabase foundation file is missing: ${file}`, 1);
    }
  }

  if (!existsSync(migrationDirectory)) {
    stop("FAIL", `Migration directory is missing: ${migrationDirectory}`, 1);
  }

  const migrations = readdirSync(migrationDirectory).filter((name) =>
    name.endsWith(".sql"),
  );

  if (migrations.length === 0) {
    stop("FAIL", "No version-controlled Supabase migration was found.", 1);
  }

  const invalidName = migrations.find((name) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(name));

  if (invalidName) {
    stop(
      "FAIL",
      `Migration filename is not timestamped and descriptive: ${invalidName}`,
      1,
    );
  }

  report("PASS", "Supabase config, migration, seed, and pgTAP files are present.");
}

assertFoundationFiles();

const supabaseCommand = findRepositorySupabaseBinary();
if (!supabaseCommand) {
  stop(
    "BLOCKED",
    "Repository Supabase CLI is unavailable. Run the clean dependency installation, then retry.",
    BLOCKED_EXIT_CODE,
  );
}

function runSupabase(args, timeout) {
  return run(supabaseCommand, args, timeout);
}

const dockerVersion = run("docker", ["version", "--format", "{{.Server.Version}}"]);
if (commandUnavailable(dockerVersion)) {
  stop(
    "BLOCKED",
    "Docker CLI is unavailable. Install Docker Desktop, then rerun this check.",
    BLOCKED_EXIT_CODE,
  );
}
if (commandTimedOut(dockerVersion) || dockerVersion.status !== 0) {
  stop(
    "BLOCKED",
    "Docker engine is stopped or unhealthy. Start Docker Desktop, then rerun this check.",
    BLOCKED_EXIT_CODE,
  );
}
report("PASS", "Docker engine is reachable.");

const supabaseVersion = runSupabase(["--version"]);
if (commandUnavailable(supabaseVersion)) {
  stop(
    "BLOCKED",
    "Supabase CLI is unavailable. Run the repository's clean dependency-install command, then retry.",
    BLOCKED_EXIT_CODE,
  );
}
if (commandTimedOut(supabaseVersion) || supabaseVersion.status !== 0) {
  stop(
    "BLOCKED",
    "Supabase CLI could not run. Verify the supported Node version and installed dependencies.",
    BLOCKED_EXIT_CODE,
  );
}
report("PASS", "Supabase CLI is available.");

// Capture status output but never print it: a healthy local status may include
// generated development credentials. Only the process result is classified.
const localStatus = runSupabase(["status"], 20_000);
if (commandTimedOut(localStatus)) {
  stop(
    "BLOCKED",
    "Supabase status timed out. The local stack is stopped or unhealthy; run the documented local start command and retry.",
    BLOCKED_EXIT_CODE,
  );
}
if (localStatus.status !== 0) {
  const statusText = capturedText(localStatus);
  const invalidConfiguration =
    statusText.includes("failed to parse") ||
    statusText.includes("invalid config") ||
    statusText.includes("decoding failed");

  if (invalidConfiguration) {
    stop(
      "FAIL",
      "Supabase configuration could not be parsed. Review supabase/config.toml without printing credentials.",
      1,
    );
  }

  stop(
    "BLOCKED",
    "Local Supabase is not running or is unhealthy. Start the local stack, then rerun verification.",
    BLOCKED_EXIT_CODE,
  );
}
report("PASS", "Local Supabase services are running.");

// Both mutations are explicitly local. --local prevents a linked hosted project
// from being selected even if a developer links one in the future.
const reset = runSupabase(["db", "reset", "--local"], 180_000);
if (commandTimedOut(reset)) {
  stop("FAIL", "Local migration replay and seed loading timed out.", 1);
}
if (reset.status !== 0) {
  stop(
    "FAIL",
    "Local database reset failed while replaying migrations or loading seed data. Raw output was suppressed to avoid leaking credentials.",
    1,
  );
}
report("PASS", "Local migrations replayed and deterministic seed data loaded.");

const tests = runSupabase(["test", "db", testDirectory, "--local"], 120_000);
if (commandTimedOut(tests)) {
  stop("FAIL", "Local pgTAP database tests timed out.", 1);
}
if (tests.status !== 0) {
  stop(
    "FAIL",
    "Local pgTAP database tests failed. Raw output was suppressed to avoid leaking credentials.",
    1,
  );
}

report("PASS", "Local pgTAP foundation tests passed.");
report(
  "PASS",
  "Supabase foundation verification completed using local resources only.",
);
