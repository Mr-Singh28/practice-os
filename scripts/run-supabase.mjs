import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findRepositorySupabaseBinary } from "./lib/supabase-cli.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const commandDefinitions = {
  start: { args: ["start"], timeout: 300_000 },
  status: { args: ["status"], timeout: 30_000 },
  stop: { args: ["stop"], timeout: 120_000 },
  reset: { args: ["db", "reset", "--local"], timeout: 180_000 },
  test: {
    args: ["test", "db", join(repositoryRoot, "supabase", "tests"), "--local"],
    timeout: 120_000,
  },
  types: {
    args: ["gen", "types", "typescript", "--local", "--schema", "public"],
    timeout: 120_000,
  },
};

const commandName = process.argv[2];
const definition = commandDefinitions[commandName];

if (!definition) {
  console.error(
    "Supabase command must be one of: start, status, stop, reset, test, types.",
  );
  process.exit(1);
}

const binary = findRepositorySupabaseBinary();
if (!binary) {
  console.error(
    "Repository Supabase CLI is unavailable. Run the documented clean dependency installation, then retry.",
  );
  process.exit(2);
}

const result = spawnSync(binary, definition.args, {
  cwd: repositoryRoot,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  timeout: definition.timeout,
  windowsHide: true,
});

if (result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM") {
  console.error(
    `Local Supabase ${commandName} timed out. Raw output was suppressed because it may contain local credentials.`,
  );
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    `Local Supabase ${commandName} failed. Raw output was suppressed because it may contain local credentials.`,
  );
  process.exit(1);
}

if (commandName === "types") {
  const destination = join(repositoryRoot, "lib", "supabase", "database.types.ts");
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, result.stdout.trimEnd() + "\n", "utf8");
  console.log("PASS: local database types generated without exposing credentials.");
} else {
  console.log(
    `PASS: local Supabase ${commandName} completed; credential-bearing output was suppressed.`,
  );
}
