# Rollback and recovery

Rollback restores a known safe application state while protecting data and preserving evidence. This foundation document defines principles only; it does not authorize production rollback, destructive migration reversal, hosted reset, force push, or history rewrite.

## Decision order

1. Stop promotion and identify the affected environment, deployment, commit, migration set, and user impact.
2. Prevent additional unsafe writes when an approved operational control exists.
3. Prefer a forward fix when it is safer than reversing a data change.
4. For application-only failures, restore a previously verified deployment through the platform's approved rollback/redeployment mechanism.
5. For database failures, follow the migration-specific recovery plan; never guess at down migrations or reset a hosted database.
6. Re-run non-destructive readiness/smoke checks and record the result.
7. Preserve a human-readable incident timeline without secrets or personal data.

## Preview recovery

A failed Preview does not advance to merge. Correct the branch, run the local baseline again, and let Git integration create a new Preview for the new commit. Preview recovery must not switch to production credentials or production data.

Deleting or redeploying a hosted Preview is still an external action and requires approval when performed by an agent.

## Application rollback

For a future approved Production deployment:

- Identify the last verified deployment and the exact current commit.
- Confirm whether the failed release included a database migration.
- If application code is backward-compatible with the current schema, use the approved Vercel rollback/redeployment control.
- If compatibility is uncertain, stop and involve the recovery owner before changing either application or database.
- Verify environment, version, readiness, and a minimal non-destructive user path after recovery.

Do not use `git reset --hard`, force push, or rewritten history as an operational rollback. A source-control follow-up should be a reviewed revert or forward-fix commit.

## Database recovery

Migrations are designed to move forward and replay from clean local state. Every future destructive migration must document its data-loss boundary and recovery before it is approved.

- Local failures may be reproduced with `npm run supabase:reset` only after confirming the target is local.
- A committed migration that has reached a shared environment is not silently edited.
- Hosted rollback may require an explicit compensating migration or restore procedure.
- A backup is useful only when its scope, timestamp, retention, encryption, and restore test are known.
- Hosted restore, reset, point-in-time recovery, or destructive SQL requires explicit environment-specific approval and an owner.
- Production recovery procedures are deferred to a separate approved runbook.

No general script may contain a hosted reset command.

## Rollback evidence

Capture:

- Environment and affected deployment/commit
- Detection time, rollback decision time, and recovery time
- Trigger and observed non-secret symptoms
- Migration filenames, if applicable
- Exact approved action and operator
- Verification commands/results
- Remaining risk, follow-up owner, and preventive action

Do not include tokens, passwords, connection strings, full environment dumps, clinical data, or internal stack traces that expose sensitive values.

## Approval boundary

Local build cleanup and local Supabase replay are Level 1 operations. Vercel Preview rollback/redeployment, hosted staging recovery, or GitHub revert publication are Level 2/3 and require explicit bounded approval. Any Production, destructive, hosted reset, domain, or history-rewrite action is Level 4 during foundation setup and must not run.
