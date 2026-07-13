import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const platformCandidates = {
  darwin: { arm64: ["darwin-arm64"], x64: ["darwin-x64"] },
  linux: {
    arm64: ["linux-arm64", "linux-arm64-musl"],
    x64: ["linux-x64", "linux-x64-musl"],
  },
  win32: { arm64: ["windows-arm64"], x64: ["windows-x64"] },
};

export function findRepositorySupabaseBinary() {
  const suffixes = platformCandidates[process.platform]?.[process.arch] ?? [];
  const require = createRequire(import.meta.url);
  const executableName = process.platform === "win32" ? "supabase.exe" : "supabase";

  for (const suffix of suffixes) {
    try {
      const packageFile = require.resolve(`@supabase/cli-${suffix}/package.json`);
      const binary = join(dirname(packageFile), "bin", executableName);
      if (existsSync(binary)) {
        return binary;
      }
    } catch {
      // Try the next platform package.
    }
  }

  return null;
}
