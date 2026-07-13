# Environment variables

Practice OS separates browser-safe configuration from server-only secrets and separates values by environment. This document lists names and handling rules only; it contains no credential values.

## Variable register

| Variable                        | Visibility                         | Typical scopes                                          | Required behavior                                                       |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV`           | Browser-safe                       | Local, Preview, staging, Production, CI                 | One of the documented non-secret environment names                      |
| `NEXT_PUBLIC_APP_URL`           | Browser-safe                       | Local, Preview, staging, Production                     | Canonical URL for that environment; never a credential-bearing URL      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser-safe                       | Local, Preview, staging, Production, CI                 | URL for the environment's Supabase project                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-exposed project credential | Local, Preview, staging, Production, CI                 | Environment-specific anonymous key; RLS remains the security boundary   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only secret                 | Approved server runtime; limited CI only when necessary | Never imported by client code or returned by readiness/error output     |
| `SUPABASE_PROJECT_REF`          | Server/CLI metadata                | Local operator or approved CI                           | Hosted project identifier for approved linking/inspection workflows     |
| `SUPABASE_DB_PASSWORD`          | Server/CLI secret                  | Secure local prompt/store or approved CI                | Never browser-visible, documented, logged, or put directly in a command |
| `VERCEL_PROJECT_ID`             | Deployment metadata                | Approved local Vercel link/CI                           | Identifies the approved Vercel project; not application runtime data    |
| `VERCEL_ORG_ID`                 | Deployment metadata                | Approved local Vercel link/CI                           | Identifies the approved Vercel account/team                             |

`NEXT_PUBLIC_` means the value can be included in a browser bundle. It does not mean that one environment's value may be reused in another. `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_DB_PASSWORD` are always server-only.

## File rules

- `.env.example` is tracked and contains names, empty placeholders, and descriptions only.
- `.env.local` and `.env.*.local` are ignored and never committed.
- Generated Vercel/Supabase environment files that contain values are ignored.
- Do not create `.env.production` or other committed secret files.
- Do not store keys in README files, tests, fixtures, scripts, command arguments, screenshots, or readiness reports.
- Missing-variable messages name variables only; they do not echo supplied or derived values.

The repository's initial `.gitignore` audit confirmed that `.env*` is ignored and `.env.example` is explicitly allowed. The initial snapshot did not yet contain `.env.example`; its eventual contents must follow this register.

## Scope matrix

| Scope       | Configuration source                                          | Data boundary                                            |
| ----------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| Local       | Ignored `.env.local` plus local Supabase output               | Synthetic data only                                      |
| CI          | Protected CI variables only when a check genuinely needs them | Local/emulated or dedicated non-production resources     |
| Development | Development secret store/project                              | No production or real clinical data during foundation    |
| Preview     | Vercel Preview scope                                          | Non-production project and safe test data                |
| Staging     | Dedicated staging scope                                       | Isolated staging project, no production credential reuse |
| Production  | Protected Production scope, configured later                  | Isolated production credentials and protected data       |

Preview and staging variables may not fall back to Production. Production values may not be copied into local or CI files.

## Limited local mode

The application may run locally without hosted values when limited mode is clearly identified. In limited mode:

- The foundation page can load.
- The current non-secret environment name can be shown.
- Readiness can report a boolean for whether each required name is configured.
- Product behavior and hosted database operations remain unavailable.
- No value, partial value, connection string, token, or stack trace is displayed.

Configuration validation should separate public and server schemas. An invalid `NEXT_PUBLIC_APP_ENV` or missing required hosted variable reports the variable name and remediation, not the supplied value.

## Secret handling and response

Enter hosted secrets through approved GitHub, Supabase, or Vercel secret interfaces after explicit approval. Identify a secret owner and rotation location for each environment.

If a possible leak is found:

1. Stop the operation and do not print the suspected value.
2. Report only the file and variable name.
3. Determine whether the file is tracked without displaying its content.
4. Ask the owner to rotate the credential and remove it from the current tree.
5. Do not rewrite Git history without a separate approved plan.

The following names are intentionally absent during this stage: `ANTHROPIC_API_KEY`, `CLAUDE_API_KEY`, and `LINEAR_API_KEY`. Ponytail configuration is also excluded.
