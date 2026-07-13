# ADR-001: Foundation stack

**Status:** Accepted for the foundation stage on 2026-07-13.

Practice OS will begin as a TypeScript modular monolith using Next.js App Router, Supabase, GitHub, Vercel, Vitest, and Playwright. Database development is migration-first: structural changes are represented by timestamped files that can be replayed against a clean local Supabase database.

## Decision

- Next.js supplies the application framework, server-rendering boundary, route handlers, and one deployable unit.
- TypeScript uses strict checking for application, tooling, and test code.
- Supabase supplies PostgreSQL plus future authentication and storage infrastructure. Foundation work creates infrastructure only, not authentication behavior or a Practice OS product schema.
- GitHub is the source of truth for commits, pull requests, CI evidence, and human review.
- Vercel is the deployment target for Git-integrated Preview and Production builds.
- Vitest is the unit-test framework; Playwright covers browser-level smoke and end-to-end verification.
- Modules remain inside one repository and deployment. Domain boundaries should be explicit in code, but no microservices, event brokers, or premature service abstractions are introduced.

## Rationale

One deployable application minimizes operational complexity while the product boundaries are still emerging. Supabase provides a local PostgreSQL workflow compatible with migration-driven development. GitHub and Vercel provide a straightforward pull-request-to-preview path, while Vitest and Playwright cover fast logic checks and user-visible readiness checks. Human approval remains the final merge gate.

## Considered alternatives

- **Microservices:** rejected for the foundation because they add deployment, networking, observability, and consistency costs before independent scaling needs exist.
- **A separate backend service:** deferred because Next.js can host the initial server boundary without dividing the deployment prematurely.
- **Dashboard-first database changes:** rejected because they create undocumented drift and cannot be replayed reliably.
- **A different unit-test framework:** acceptable only if a compatible framework already existed; the initial repository declared Vitest.
- **A non-Vercel host or non-Supabase database:** not selected for this scope because the foundation brief explicitly standardizes the delivery stack.

## Consequences

- Code must preserve clear server/client and module boundaries inside a single application.
- Database reviews include migration files, seed implications, replay evidence, and recovery considerations.
- A clean install and the same Node/package-manager versions are required locally and in CI.
- Preview deployments must not use production credentials or production data.
- Replacing Supabase or Vercel later will require deliberate migration work; their use must therefore stay behind clear repository boundaries.
- Foundation readiness does not imply that any product feature, product schema, hosted project, or production deployment exists.
