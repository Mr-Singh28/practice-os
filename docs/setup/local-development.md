# Local development

This guide prepares a developer workstation for the Practice OS foundation. Every command is run from the repository root. It does not create or modify a hosted project and does not implement a product feature.

## Initial audit facts

On 2026-07-13, the initial scaffold declared Node `24.18.0` and npm `12.0.1`, but the auditing shell reported Node `20.18.0` and npm `10.8.2`. The foundation was normalized to the supported Node `24` LTS line and npm `11.16.0`; the bundled Node `24.14.0` runtime was used for local verification. Docker and Supabase results are recorded in the readiness report rather than inferred from tool presence.

## Prerequisites

- Git
- Node `24` LTS (the latest supported 24.x release is selected by `.nvmrc`)
- npm `11.16.0`
- Docker Desktop with its engine running for local Supabase
- The project-local Supabase CLI installed by `npm ci`
- Playwright browser prerequisites for end-to-end tests

Check the active runtime before installing:

```bash
node --version
npm --version
```

If the versions do not match `.nvmrc` and `package.json`, switch runtimes first. Do not regenerate the lockfile with a different package-manager version merely to bypass the mismatch.

The tracked `.npmrc` enforces the Node engine and fails a clean install when a dependency introduces an unreviewed lifecycle script. Required install-script approvals are narrow and version-pinned in `package.json`.

## First-time setup

1. Install exactly from the lockfile:

   ```bash
   npm ci
   npm run playwright:install
   ```

   The browser wrapper stores Chromium under the ignored project-local `.tools/` directory so the installation stays inside this workspace.

2. Create `.env.local` from `.env.example` and enter local values through the editor or approved secret source. Never paste values into documentation or shell history.

3. Start and inspect the local Supabase stack:

   ```bash
   npm run supabase:start
   npm run supabase:status
   ```

4. Replay version-controlled migrations and the test-only seed against **local Supabase only**:

   ```bash
   npm run supabase:reset
   npm run supabase:types
   npm run supabase:verify
   ```

5. Start the application:

   ```bash
   npm run dev
   ```

The foundation page and readiness endpoint may run in limited local mode when hosted configuration is absent. They must show only an environment name and configuration-presence booleans, never a URL, key, password, token, or full environment dump.

## Daily workflow

```bash
npm run supabase:start
npm run dev
```

Before review:

```bash
npm run verify
npm run test:e2e:smoke
npm run security:secrets
git status --short
```

Stop local database containers when they are no longer needed:

```bash
npm run supabase:stop
```

## Command safety

| Level                                         | Examples                                                                                     | Effect                                                                 | Approval                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| Level 0 — read-only                           | `node --version`, `npm --version`, `git status`, `npm run supabase:status`                   | Inspects local state                                                   | No                                         |
| Level 1 — local mutation                      | `npm ci`, `npm run dev`, `npm run build`, `npm run supabase:start`, `npm run supabase:reset` | Changes dependency, build, process, container, or local database state | No, when scoped to this folder/local stack |
| Level 2 — hosted development/staging mutation | `supabase link`, hosted `supabase db push`, hosted secret changes                            | Changes or associates a shared hosted system                           | Explicit approval                          |
| Level 3 — deployment/operation                | `vercel deploy`, remote settings, branch protection                                          | Creates a deployment or changes external operations                    | Explicit bounded approval                  |
| Level 4 — production/destructive              | Hosted reset, destructive production migration, force push                                   | Production or destructive change                                       | Out of scope                               |

`npm run supabase:reset` must retain the `--local` safeguard in the underlying script. Never substitute a hosted connection string.

## Verification expectations

A successful local foundation run records the exact command, exit result, and non-secret evidence for formatting, lint, typecheck, unit tests, build, local migration replay, generated types, Playwright smoke, and secret scanning. A skipped command is `NOT TESTED`; an unavailable prerequisite is `BLOCKED`.

If installation, build, or test commands fail, use [troubleshooting](../operations/troubleshooting.md). Do not delete user changes, rewrite Git history, connect to production, or install system-level software without approval.
