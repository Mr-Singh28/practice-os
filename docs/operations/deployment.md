# Deployment operations

This runbook defines the intended reviewed deployment path. It does not authorize a deployment, hosted database change, project link, environment-variable update, or domain change.

## Deployment model

```text
Scoped branch
→ Pull request
→ GitHub Actions baseline
→ Vercel Preview
→ Non-destructive Preview smoke test
→ Human code and preview review
→ Human approval
→ Merge to main by a human
→ Vercel Production deployment
→ Non-destructive Production readiness check
```

Production deployment is deferred until GitHub and Vercel are approved, linked, protected, and verified. AI tools and CI cannot approve or merge their own changes.

## Preconditions

Before requesting a Preview:

1. The change is foundation-only or tied to one approved future work item.
2. Node/npm versions match repository controls and `npm ci` succeeds.
3. `npm run verify`, `npm run test:e2e:smoke`, and the local secret check have documented results.
4. Database migrations, if any, replay against a clean local Supabase stack.
5. The pull request lists environment-variable names changed, migration/recovery implications, security considerations, and limitations.
6. Preview variables point only to non-production services and safe data.
7. No secret or environment dump is included in build or test logs.

An unavailable prerequisite is a blocker. It is not acceptable to replace a failed migration, smoke, or build result with a placeholder success.

## Preview procedure

1. Confirm the Vercel project, GitHub repository, branch, and commit.
2. Confirm that the deployment is a Preview and that Production is not selected.
3. Confirm required Preview variable **names** are present in the Preview scope; do not display values.
4. Allow the Git integration to build the exact reviewed commit.
5. Run the repository's Preview verification/smoke command against the provided Preview URL.
6. Verify the foundation heading, environment indicator, readiness response, absence of obvious runtime errors, and absence of exposed secrets.
7. Capture the Preview URL, commit, build result, smoke result, and reviewer. Do not capture secret-bearing screens.
8. Obtain human review and approval before merge.

Manual `vercel deploy` is a Level 3 external action and requires explicit bounded approval even when it creates only a Preview.

## Production procedure

Production deployment is not authorized during foundation setup. When a later approved runbook enables it, the minimum gate is:

- Protected `main` with required CI checks and a human approval
- Environment-specific Production credentials entered by an approved owner
- No Preview or staging credential reused in Production
- An approved migration and recovery plan
- A known good deployment identifier for rollback
- A change owner and recovery owner available
- Non-destructive readiness and smoke checks

No domain change, custom tenant domain, team-setting change, or direct workstation-to-production deployment belongs in the general workflow.

## Database changes

Application deployment and database migration are separate controlled actions. A Git merge does not by itself authorize a hosted `supabase db push`.

For any future hosted migration, review:

- Exact migration files and target project reference
- Whether the change is additive or destructive
- Lock/downtime and compatibility implications
- Backup/recovery prerequisites
- Forward-fix and rollback limitations
- Verification queries that return no personal data
- Explicit approval for the named environment

Production database mutations and hosted resets remain out of scope.

## Evidence record

Record only non-secret evidence:

- Commit and pull-request identifier
- CI job names and results
- Migration filenames and local replay result
- Vercel deployment identifier/URL and environment
- Smoke/readiness result
- Human reviewer and approval
- Known limitations and rollback trigger
- Confirmation that no production system was changed outside the approved action

If a deployment or verification fails, stop promotion, preserve logs without secrets, and follow [rollback](rollback.md) or [troubleshooting](troubleshooting.md). Do not retry by widening permissions, changing domains, using production credentials in Preview, or bypassing required checks.
