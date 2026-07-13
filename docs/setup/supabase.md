# Supabase setup

Supabase provides the local PostgreSQL, future authentication infrastructure, and future storage infrastructure for Practice OS. Foundation setup proves that local configuration, migrations, seed data, database tests, and type generation work; it does not create a Practice OS product schema or connect to a hosted project.

## Initial audit facts

On 2026-07-13, the Supabase JavaScript client and CLI were declared in `package.json`, and both a PATH executable and a project-local binary were discoverable. No `supabase/` directory, configuration, migration, seed, database test, generated type, or verification script existed in the read-only snapshot. Docker was installed, but Docker-engine health and the local Supabase stack were not checked. These items remain unverified until their local commands succeed.

## Local prerequisites

1. Activate the repository's Node/npm versions.
2. Run `npm ci` to install the lockfile, including the project-local Supabase CLI.
3. Start Docker Desktop and confirm its engine is healthy.
4. Keep all commands in the repository root.
5. Use synthetic test data only; never import real client or clinical data.

## Local workflow

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:types
npm run supabase:verify
npm run supabase:stop
```

- `supabase:start` starts local containers.
- `supabase:status` reads local service status.
- `supabase:reset` must target local Supabase only, recreate the local database, replay committed migrations, and load the test seed.
- `supabase:types` generates TypeScript from the local schema.
- `supabase:verify` validates local configuration and migration prerequisites without contacting production.
- `supabase:stop` stops the local stack without deleting hosted resources.

Record command exit codes and non-secret summaries. Do not include local keys or connection strings in evidence.

## Migration policy

1. Every structural database change is a descriptive, timestamped migration committed to Git.
2. Migrations replay from a clean local database in chronological order.
3. Seed data is synthetic test data only.
4. No real client or clinical data may be used locally, in development, or in staging during foundation setup.
5. Direct dashboard schema edits are prohibited. An emergency exception requires a future documented reconciliation procedure.
6. Migration drift must be checked before release.
7. Hosted pushes require explicit approval.
8. General scripts may reset only the local database; they must not include a hosted reset.
9. A future destructive migration documents data loss, backup, roll-forward/rollback limits, and recovery before review.
10. Approved existing migrations are preserved.

The foundation baseline may create only proof objects needed to validate migration execution, seeding, database tests, and type generation. It must not create tenants, practitioners, clients, bookings, CRM, payments, notes, forms, messages, referrals, community, or analytics tables.

## Creating and replaying a migration

1. Confirm local status: `npm run supabase:status`.
2. Create a descriptively named local migration with the project-local CLI.
3. Write only the reviewed foundation SQL.
4. Run `npm run supabase:reset` to replay from clean local state.
5. Run database verification and regenerate types.
6. Review the migration, seed impact, and recovery implications in the pull request.

If a local migration fails, preserve the error, fix or add a forward migration as appropriate, and reset the local stack again. Never point recovery commands at a hosted database. Do not alter an already-deployed migration without an explicit compatibility decision.

## Hosted-project preparation

No hosted Supabase login, project creation, link, migration list, push, type generation, or secret change was executed. Before linking, the user must provide or approve:

- Supabase organization/account
- Development and staging project names and references
- Approved region, plan, and billing decision
- Database-password storage location and secret owner
- Dashboard-access owners and recovery owner
- Data restrictions and retention policy

The intended long-term layout is one development project, one staging project, and a separately protected production project created later. Credentials are distinct across all environments.

## Command classification

| Command                                                 | Classification      | Target/effect                                 | Approval                          |
| ------------------------------------------------------- | ------------------- | --------------------------------------------- | --------------------------------- |
| `npm run supabase:status`                               | Level 0             | Reads local stack                             | No                                |
| `npm run supabase:start` / `stop`                       | Level 1             | Local containers                              | No                                |
| `npm run supabase:reset`                                | Level 1             | Destructively recreates local DB only         | No, after confirming local target |
| `npm run supabase:types`                                | Level 1             | Reads local schema and writes generated types | No                                |
| `supabase login`                                        | Level 2 preparation | Creates local account authentication          | Explicit approval                 |
| `supabase link --project-ref <development-project-ref>` | Level 2             | Associates folder with hosted development     | Explicit approval                 |
| `supabase migration list` after link                    | Level 0 remote read | Reads hosted migration state                  | Approved account context required |
| `supabase db push`                                      | Level 2             | Mutates hosted development/staging schema     | Explicit bounded approval         |
| Hosted reset or production mutation                     | Level 4             | Destructive/production change                 | Out of scope                      |

Passwords must be supplied through secure prompts or approved environment variables, never embedded in commands. Before a hosted action, show the exact target, expected migration set, permissions, potential cost, reversibility, recovery plan, and evidence to capture.
