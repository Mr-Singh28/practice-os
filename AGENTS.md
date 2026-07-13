# Practice OS agent instructions

## Commands

- Install: `npm ci`
- Develop: `npm run dev`
- Format: `npm run format`
- Check formatting: `npm run format:check`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Unit tests: `npm run test:unit`
- All configured tests: `npm run test`
- Build: `npm run build`
- Verify baseline: `npm run verify`
- Start local Supabase: `npm run supabase:start`
- Reset local Supabase only: `npm run supabase:reset`
- Playwright smoke test: `npm run test:e2e:smoke`

Use the Node `24` LTS line selected by `.nvmrc`, npm `11.16.0`, and the committed lockfile. Do not claim a check passed unless its command completed successfully in the current workspace.

## Architecture

- Keep Practice OS a modular monolith built with Next.js and TypeScript.
- Use Supabase through explicit public/server boundaries.
- Keep database structure in timestamped, version-controlled, replayable migrations.
- Keep service-role credentials and database passwords server-only.
- During foundation setup, add infrastructure and verification only—no Practice OS product behavior or product schema.

## Delivery rules

- Work on one clearly scoped task at a time and avoid unrelated changes.
- Preserve existing valid work and all uncommitted user changes.
- Add tests for behavior changes and record the commands actually run.
- Do not access production data, production databases, or production secrets.
- Do not make direct production changes or undocumented schema changes.
- External mutations require explicit, bounded user approval at action time.
- Never put a secret value in source, documentation, logs, shell arguments, or reports.
- Do not commit, push, deploy, merge, or alter hosted settings without authorization.
- CI may verify but must not merge. Human review and approval are mandatory.

## Excluded tools and work

- Ponytail is not used or configured.
- Claude, Claude Code, Anthropic, Anthropic APIs, and Anthropic GitHub Actions are not used or configured.
- Linear is not configured during this foundation stage.
- Automated AI reviewers are not configured.
- PRA-5 and all product features remain out of scope.

Historical documents may mention excluded tools; do not rewrite history solely to remove a mention. Remove only active configuration that conflicts with these rules.

## Definition of Done for foundation work

- Formatting, linting, type checking, unit tests, and the production build pass.
- The local migration replay and database checks pass when Docker and Supabase are available; otherwise they are explicitly `BLOCKED`.
- The Playwright smoke test passes when its prerequisites are available.
- No secrets or generated secret-bearing files are committed.
- Documentation and verification evidence are current.
- No product feature or product database schema was introduced.
- No hosted or production system was changed without approval.
- A human reviews and approves the work before merge.
