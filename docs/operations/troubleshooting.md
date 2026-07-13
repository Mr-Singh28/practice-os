# Troubleshooting

Use this guide for local foundation failures. Start with read-only inspection, preserve user work, and never solve a local problem by connecting to Production or printing secrets.

## Runtime mismatch

**Symptom:** `npm` reports an unsupported engine, or local behavior differs from CI.

**Check:**

```bash
node --version
npm --version
```

The repository expects the Node `24` LTS line and npm `11.16.0`. The initial audit found Node `20.18.0` and npm `10.8.2` active. Switch to the configured runtime, then run a clean lockfile install. Do not change `.nvmrc`, `engines`, or the lockfile merely to match an accidental workstation runtime.

## Dependency install is not clean

**Symptom:** `npm ci` fails or `npm ls --depth=0` reports missing/extraneous packages.

**Checks:** confirm the runtime, package-manager version, `package-lock.json`, available disk space, and registry access. The initial audit reported an extraneous `@emnapi/runtime` package in `node_modules`; only a successful `npm ci` under the configured runtime can establish a clean state. Do not hand-edit `node_modules` or silently update the lockfile.

## Next.js cannot build or start

**Symptom:** no route is found, required modules are missing, or build fails before rendering.

Confirm that the App Router foundation, `next-env.d.ts`, environment validation, and imported source files exist. The initial audit had Next.js declarations but no `app/` directory. A declared dependency or script is not evidence that the application foundation is complete.

Run checks individually to isolate the first failure:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

## ESLint or Prettier cannot find configuration

ESLint 9 expects a compatible flat configuration. Confirm the repository's ESLint config exists and includes Next.js/TypeScript rules without scanning generated outputs. Prettier can use defaults, but the repository should explicitly ignore dependencies, build artifacts, generated reports, and local Supabase state. Do not use `--fix` until the failure scope is understood.

## Unit tests cannot resolve modules

The initial tests referenced environment and readiness helpers that did not exist in the initial snapshot. Verify import paths and implementation files before changing test expectations. The tests intentionally assert that secret-like fixture values are not returned; keep those safety checks.

## Docker or local Supabase is unavailable

**Checks:**

```bash
docker --version
docker info
npm run supabase:status
```

`docker info` is a local engine-health query; it may fail when Docker Desktop is installed but its engine is stopped. If Docker or the Supabase CLI is missing, classify local database verification as `BLOCKED`. Do not install system software without approval, do not claim a migration replay passed, and continue only with repository preparation that does not require execution.

If the local stack is unhealthy, stop local containers, inspect non-secret logs, restart Docker if appropriate, and try the local start/status flow. Never substitute a hosted project to make a local check pass.

## Migration reset fails

1. Confirm the CLI is targeting local Supabase.
2. Record the migration filename and non-secret error.
3. Correct the local migration or add an appropriate forward migration.
4. Run `npm run supabase:reset` again.
5. Regenerate types and run database verification.

Do not edit an already-shared migration casually, use real data in the seed, or run a hosted reset.

## Playwright smoke test fails

Confirm the configured web server starts, the base URL is local/Preview rather than Production, browser prerequisites are installed, and the expected foundation heading/readiness endpoint exist. Preserve `playwright-report/` or `test-results/` only as non-secret local evidence. Screenshots must not expose credentials or personal data.

## Environment validation fails

Compare missing **names** with `.env.example` and [the variable register](../setup/environment-variables.md). Do not print the environment or paste values into a command. Limited local mode is acceptable only where documented; Preview, staging, and Production must not silently fall back to another environment's credentials.

## GitHub or Vercel commands are unavailable

The initial audit did not find `gh` or `vercel` on `PATH`. Their absence blocks CLI-based hosted preparation but does not block local source and test work. Installation, login, project linking, pushes, settings changes, and deployments require the user decisions and approvals in the respective setup guides.

## Unexpected generated or untracked files

Use:

```bash
git status --short
git check-ignore -v <path>
```

Determine which tool created the file before deleting or ignoring it. TypeScript incremental builds may create `tsconfig.tsbuildinfo`; test/build tools may create coverage, `.next`, Playwright results, or local Supabase state. Preserve unknown user work and add only appropriate reproducible artifacts to ignore rules.

## Possible secret leak

Stop immediately. Do not print the suspected value. Report only the file and variable name, check whether the path is tracked, and ask the secret owner to rotate/remove it. Do not commit the file and do not rewrite Git history without a separately approved recovery plan.

## Escalation record

When a blocker remains, record the exact local command, prerequisite, exit status, non-secret error summary, affected file, attempted safe recovery, and the specific user action or external approval required. Use `BLOCKED` or `NOT TESTED`; never convert missing evidence into `PASS`.
