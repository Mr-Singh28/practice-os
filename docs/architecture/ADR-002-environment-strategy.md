# ADR-002: Environment strategy

**Status:** Accepted for the foundation stage on 2026-07-13.

Practice OS separates local, development, preview, staging, and production environments. Each environment has a distinct purpose, credentials, and data boundary; production access is excluded from agent work during foundation setup.

## Environments

| Environment | Purpose                                       | Data and credential rule                                      | Deployment path                                       |
| ----------- | --------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Local       | Developer work and migration replay           | Local Supabase, synthetic test data, local-only credentials   | Developer machine only                                |
| Development | Shared hosted integration work after approval | Dedicated development project; no real clinical data          | Approved development workflow                         |
| Preview     | Per-pull-request review                       | Non-production credentials and disposable/safe test data      | GitHub pull request to Vercel Preview                 |
| Staging     | Release-candidate verification                | Dedicated staging credentials; no production credential reuse | Approved staging promotion workflow                   |
| Production  | Live service, created later                   | Isolated production secrets and protected live data           | Approved merge to `main`, protected Vercel deployment |

Preview and staging may never fall back to production Supabase variables. Local limited mode may run without hosted credentials, but it must identify missing variable names without printing their values.

## Rationale

Environment separation reduces the chance that development, tests, previews, or agents affect live data. It also makes failures reproducible: local migrations can be reset and replayed, pull requests can be reviewed on isolated previews, and production changes can remain behind human and deployment controls.

## Considered alternatives

- **One shared Supabase project for every environment:** rejected because credentials and data would cross trust boundaries.
- **Preview builds connected to production:** rejected because browser tests or unfinished code could expose or mutate live data.
- **Secrets committed in environment files:** rejected because Git history is not a secret store.
- **Direct production deployments from a workstation:** rejected because they bypass reviewed source and CI evidence.

## Consequences

- Environment variables must be entered independently in each approved system and must not be copied automatically from production.
- Development, staging, and production Supabase projects require separate references and database passwords.
- Vercel Preview and Production variables require separate scopes.
- Logs, readiness endpoints, errors, CI output, and documentation may show variable names or presence booleans only.
- Promotion between environments is a controlled deployment decision, not a database copy operation.
- Production rollback and destructive migration recovery require a future, explicitly approved runbook.
