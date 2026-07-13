import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const playwrightCli = path.join(
  projectRoot,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);

const result = spawnSync(process.execPath, [playwrightCli, ...process.argv.slice(2)], {
  cwd: projectRoot,
  env: {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH:
      process.env.PLAYWRIGHT_BROWSERS_PATH ??
      path.join(projectRoot, ".tools", "ms-playwright"),
  },
  stdio: "inherit",
});

if (result.error) {
  console.error(`Playwright could not start: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
