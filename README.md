# Practice OS

Practice OS is currently in its repository-foundation stage. This repository is being prepared as a modular Next.js and TypeScript application with local Supabase development, GitHub pull-request verification, Vercel deployments, unit tests, and Playwright smoke tests.

This stage does **not** implement authentication, tenancy, booking, CRM, payments, clinical notes, forms, messaging, referrals, community, analytics, custom domains, or any other Practice OS product feature.

## Foundation status

The initial audit on 2026-07-13 found an initialized but uncommitted Git repository on `main`, no Git remote, an npm lockfile, and declarations for Next.js, TypeScript, Vitest, Playwright, ESLint, Prettier, the Supabase client, and the Supabase CLI. The foundation now selects the supported Node `24` LTS line with npm `11.16.0`, while the default workstation shell still resolves Node `20.18.0` with npm `10.8.2`; activate Node 24 before treating verification results as authoritative.

At the time of that audit, local Docker-engine health, the local Supabase stack, migrations, browser prerequisites, GitHub authentication, Vercel authentication, and all hosted links were unverified. No hosted system was changed.

## Architecture

- Next.js App Router and TypeScript
- A modular monolith, with domain modules kept inside one deployable application
- Supabase for PostgreSQL, authentication infrastructure, and storage infrastructure
- Version-controlled, replayable database migrations
- GitHub pull requests and CI, with at least one human approval before merge
- Vercel Preview deployments for pull-request review and Production deployments only after an approved merge to `main`
- Vitest for unit tests and Playwright for browser smoke tests
- Server-only handling for service-role credentials and database passwords

See the [foundation stack decision](docs/architecture/ADR-001-foundation-stack.md), [environment strategy](docs/architecture/ADR-002-environment-strategy.md), and [agent access boundaries](docs/architecture/ADR-003-agent-access-boundaries.md).

## Prerequisites

1. The Node `24` LTS line and npm `11.16.0`, as declared by `.nvmrc` and `package.json`.
2. Docker Desktop with a running Docker engine for the local Supabase stack.
3. The Supabase CLI. A project-local CLI is declared in `devDependencies`; do not silently substitute an incompatible global version.
4. Playwright browser prerequisites before running end-to-end tests.
5. Git for local source control.

GitHub CLI and Vercel CLI are optional until their respective hosted setup is approved. They were not available on `PATH` during the initial audit.

## Local start

```bash
npm ci
npm run playwright:install
npm run supabase:start
npm run dev
```

The application is intended to support a documented limited local mode when hosted Supabase variables are absent. Limited mode must report only whether configuration names are present; it must never display values.

Run the safe baseline before requesting review:

```bash
npm run verify
npm run test:e2e:smoke
```

`npm run verify` is designed to run formatting, linting, type checking, unit tests, a production build, and safe local database validation in that order. A missing Docker engine, Supabase CLI, local configuration, or implementation file is a blocker—not a passing result.

## Common commands

| Purpose                       | Command                    |
| ----------------------------- | -------------------------- |
| Install from the lockfile     | `npm ci`                   |
| Develop                       | `npm run dev`              |
| Format                        | `npm run format`           |
| Check formatting              | `npm run format:check`     |
| Lint                          | `npm run lint`             |
| Typecheck                     | `npm run typecheck`        |
| Unit tests                    | `npm run test:unit`        |
| Browser tests                 | `npm run test:e2e`         |
| Browser smoke test            | `npm run test:e2e:smoke`   |
| Production build              | `npm run build`            |
| Safe baseline                 | `npm run verify`           |
| Start local Supabase          | `npm run supabase:start`   |
| Check local Supabase          | `npm run supabase:status`  |
| Reset only local Supabase     | `npm run supabase:reset`   |
| Generate local database types | `npm run supabase:types`   |
| Dependency audit              | `npm run security:audit`   |
| Local secret-pattern check    | `npm run security:secrets` |

## Security and delivery guardrails

- Never commit `.env.local`, `.env.*.local`, credentials, tokens, passwords, or real client/clinical data.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_DB_PASSWORD` to browser code.
- Make every structural database change through a committed migration.
- Do not reset, migrate, seed, or inspect a hosted database without explicit bounded approval.
- Do not push, create repositories, link projects, set hosted environment variables, deploy, or change branch protection without approval.
- CI verifies work but does not merge it. A human reviewer approves and merges.
- AI tools have no production database access, production secret access, or production deployment authority.
- Ponytail is not used. Claude and Anthropic are not configured. Linear is deferred during foundation setup.

## Documentation

- [Local development](docs/setup/local-development.md)
- [Environment variables](docs/setup/environment-variables.md)
- [GitHub setup](docs/setup/github.md)
- [Supabase setup](docs/setup/supabase.md)
- [Vercel setup](docs/setup/vercel.md)
- [Deployment operations](docs/operations/deployment.md)
- [Rollback principles](docs/operations/rollback.md)
- [Troubleshooting](docs/operations/troubleshooting.md)

The basic setup gate is complete only when the configured runtime is active, a clean install succeeds, formatting/lint/typecheck/unit/build checks pass, local migrations replay when local Supabase is available, the Playwright smoke test passes, no secrets are tracked, the required documentation and CI workflow exist, and a human has reviewed the change. Hosted account setup may remain a clearly identified user action; it must never be represented as locally verified.
