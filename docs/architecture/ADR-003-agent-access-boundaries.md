# ADR-003: Agent access boundaries

**Status:** Accepted for the foundation stage on 2026-07-13.

Codex may inspect and modify files inside the Practice OS project folder within the approved task scope. External mutations, production access, merges, and deployment authority remain with the user and human reviewers.

## Decision

- Codex may run safe local inspection and verification and may make scoped local project changes requested by the user.
- A command that creates or changes a GitHub, Supabase, Vercel, or other hosted resource requires explicit bounded approval before execution.
- Codex cannot approve or merge its own pull request. At least one human reviews and approves before merge.
- AI tools receive no production database access, production data access, production secret access, or production deployment authority during this stage.
- Production deployments, destructive operations, history rewrites, and hosted database resets are out of scope.
- Claude, Claude Code, Anthropic, Anthropic APIs, and Anthropic GitHub Actions are deferred and are not configured.
- Ponytail is not used.
- Linear integration is deferred until the repository foundation gate is complete.
- Any future coding agent, reviewer, or integration requires a separate access and permission decision.

## Rationale

Local automation accelerates repeatable setup and verification, but hosted mutations can create cost, expose secrets, alter shared state, or affect users. A clear approval boundary preserves human accountability and prevents CI or an AI tool from becoming its own reviewer and merger.

## Considered alternatives

- **Standing hosted credentials for agents:** rejected because the authority would be broader and longer-lived than the individual task.
- **Automatic AI review and merge:** rejected because it removes the independent human gate required for foundation work.
- **Production access with read-only credentials:** deferred because even metadata can be sensitive and is unnecessary for local foundation setup.

## Consequences

- Documentation and readiness reports must distinguish local evidence from unverified hosted state.
- Before an approved external action, the operator must show the exact command, target, permission, expected effect, cost risk, reversibility, rollback, and evidence plan.
- Secrets are supplied through approved secret stores or secure prompts, never source files or command-line literals.
- A missing credential or account decision is reported as `USER ACTION REQUIRED` or `BLOCKED`, never bypassed.
- Human review remains mandatory even when every automated check passes.
