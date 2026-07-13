# Vercel setup

Vercel is the planned Git-integrated deployment platform for Practice OS. This guide prepares the delivery model; it does not log in, create or link a project, pull remote settings, set environment variables, deploy, change a domain, or modify a team.

## Initial audit facts

On 2026-07-13, the Vercel CLI was not available on `PATH`. No `.vercel/` linkage directory or `vercel.json` existed. The repository did ignore `.vercel/` local state. Vercel authentication, project linkage, build behavior, and deployments were unverified.

A `vercel.json` file should exist only when the application needs behavior that cannot be expressed through Next.js and Vercel project settings. It must never contain a secret.

## Intended delivery path

```text
Feature branch
→ GitHub pull request
→ GitHub Actions verification
→ Vercel Preview deployment
→ Automated non-production smoke test
→ Human code and preview review
→ Human approval
→ Merge to main
→ Vercel Production deployment
```

CI and AI tools cannot merge. A Production deployment follows an approved merge to `main`; no production deployment is run manually during foundation setup.

## Environment separation

- **Local:** `.env.local`, local Supabase, synthetic data.
- **Preview:** Vercel Preview variables and a non-production Supabase project/data set.
- **Staging:** dedicated staging variables and Supabase project when a staging deployment is introduced.
- **Production:** isolated Production variables and a protected production project created later.

Preview and staging must never use production Supabase credentials or production data. Production variables are entered only in the Production scope by an approved owner. Variable values must not appear in build logs, smoke output, screenshots, or documentation.

## Build and verification

Vercel should use the same compatible Node major declared by the repository and install from the npm lockfile. Build failures remain visible and block promotion. A Preview smoke test targets only the generated Preview URL and performs non-destructive readiness checks.

Before approval, record:

- Framework and root-directory detection
- Install and build commands
- Node version
- Preview URL and commit
- Non-secret environment-presence result
- Smoke-test result
- Human reviewer and limitations

## CLI classification

These commands are prepared but were not executed:

| Command                | Reads/changes                                      | Classification            | Approval                                  |
| ---------------------- | -------------------------------------------------- | ------------------------- | ----------------------------------------- |
| `vercel whoami`        | Reads authenticated account                        | Level 0 remote read       | Approved account context required         |
| `vercel login`         | Changes local authentication/account state         | Level 2 preparation       | Explicit approval                         |
| `vercel link`          | Changes local files and hosted project association | Level 2                   | Explicit approval                         |
| `vercel pull`          | Reads remote state and writes local files          | Level 2                   | Explicit approval                         |
| `vercel env ls`        | Reads remote variable names/scopes                 | Level 0 remote read       | Approved account/project context required |
| `vercel deploy`        | Creates a Preview deployment                       | Level 3                   | Explicit bounded approval                 |
| `vercel deploy --prod` | Creates a Production deployment                    | Level 4 during foundation | Out of scope                              |

Do not pass tokens or environment-variable values in a command. Before any action, show the exact team/project, expected change, permission, possible cost, reversibility, rollback or redeploy plan, and evidence to capture.

## User decisions required

1. Confirm the Vercel account/team and billing decision.
2. Confirm whether an existing project should be linked or a new one created.
3. Approve installing and authenticating the CLI if needed.
4. Approve the GitHub repository connection.
5. Provide environment-variable values through Vercel's protected UI or another approved secret workflow.
6. Confirm the development/preview/staging Supabase mapping.
7. Approve a first Preview separately; Production remains out of scope.

Domain changes, custom tenant domains, team-setting changes, and production rollback operations are deferred.
