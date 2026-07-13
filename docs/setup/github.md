# GitHub setup

GitHub is the planned source of truth for Practice OS source control, pull requests, CI evidence, and human review. This document prepares the workflow; it does not create a repository, add a remote, push code, change settings, or authenticate an account.

## Initial audit facts

On 2026-07-13, `G:\Practice OS` was an initialized Git repository on an unborn `main` branch. It had no commits, no tracked files, and no remotes. Every foundation file then present was untracked. The GitHub CLI was not available on `PATH`. These are snapshot facts and must be rechecked before any GitHub action.

Safe local inspection:

```bash
git status --short --branch
git branch --show-current
git remote -v
git ls-files
```

## Pull-request workflow

1. Create a clearly scoped branch locally after the repository and remote are approved.
2. Make foundation-only changes and run `npm run verify` plus the relevant smoke/security checks.
3. Commit intentionally; do not include secrets, generated local state, or unrelated work.
4. Push only after the user approves the target repository and branch.
5. Open a pull request using the repository template.
6. Let CI run formatting, lint, typecheck, unit tests, safe migration checks where available, build, and smoke checks.
7. Review the Vercel Preview with non-production credentials.
8. Resolve review conversations and obtain at least one human approval.
9. A human merges to `main`; an AI tool or CI workflow cannot approve and merge its own changes.

Use a work-item reference such as `PRA-<number>` in branch names, commits, and pull-request descriptions when a work item exists. Foundation-only changes without a card should state their purpose explicitly; this does not configure Linear.

## Pull-request evidence

Every pull request should record:

- Purpose/work item, scope, and explicit non-goals
- Files changed
- Database migrations and recovery implications
- Environment-variable names changed, never values
- Tests and exact commands run
- Security considerations and secret-scan result
- Preview URL and screenshots/evidence when available
- Rollback considerations, limitations, and blockers
- Named human reviewer and approval status
- Confirmation that no secret was committed and no production system was changed

## CI policy

The workflow runs on pull requests and pushes to `main`. It uses least-privilege read permissions, official pinned actions, the repository's Node/npm versions, and `npm ci`. It must not silently update the lockfile, dump environment variables, mutate a hosted database, deploy production, grant write access without need, merge a pull request, or configure an AI reviewer.

If local Supabase validation cannot run on the GitHub runner, the workflow and readiness evidence must mark it pending or blocked. A placeholder is not a passing migration check.

## Branch-protection checklist

Apply only after explicit approval and after the repository owner is known:

- Default branch is `main`.
- Pull requests are required.
- At least one human approval is required.
- Required status checks match the final CI job names.
- Review conversations must be resolved.
- Stale approvals are dismissed after material changes.
- Direct pushes and force pushes are blocked.
- Branch deletion is restricted.
- Administrators follow the protections where practical.
- Merge is a human action.
- Production deployment follows an approved merge.
- AI tools cannot approve or merge their own work.

## Commands and approval boundary

| Command/action                          | Classification               | State change                         | Approval                                        |
| --------------------------------------- | ---------------------------- | ------------------------------------ | ----------------------------------------------- |
| `git status --short --branch`           | Level 0, local read          | None                                 | No                                              |
| `git remote -v`                         | Level 0, local read          | None                                 | No                                              |
| `gh auth status`                        | Level 0, remote/account read | None; requires CLI/auth              | Ask before account access if context is unclear |
| `git init`                              | Level 1, local mutation      | Initializes local metadata           | No when requested; already done in the audit    |
| Add/replace a Git remote                | Level 2                      | Changes repository association       | Explicit approval                               |
| Create a GitHub repository              | Level 2                      | Creates hosted resource/cost context | Explicit approval                               |
| Push a branch                           | Level 2                      | Publishes commits                    | Explicit approval                               |
| Add GitHub secrets or branch protection | Level 2                      | Changes hosted security settings     | Explicit approval                               |
| Merge or force push                     | Level 3/4                    | Changes shared/default history       | Human merge only; force push out of scope       |

Before any hosted mutation, show the exact command, GitHub owner/repository, requested permission, expected change, possible cost, reversibility, rollback, and evidence to capture. No exact remote-mutation command can be finalized until the intended repository and owner are supplied.

## User decisions required

1. Confirm the GitHub owner/organization and intended repository name.
2. Decide whether to create a new repository or use an existing one.
3. Install and authenticate GitHub CLI if it will be used.
4. Approve the remote URL and first push separately.
5. Name CODEOWNERS/review owners.
6. Approve branch-protection settings after CI job names exist.

Do not add hosted secrets until each name, environment, owner, and rotation responsibility is agreed.
