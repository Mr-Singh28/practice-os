-- Foundation-only proof object. This is not a Practice OS product-domain table.
-- It exists solely to prove migration replay, deterministic seeding, pgTAP tests,
-- and database type generation before feature work begins.
create table public.foundation_health (
  id smallint primary key,
  status text not null check (status = 'ready'),
  seeded_at timestamptz not null,
  constraint foundation_health_singleton check (id = 1)
);

comment on table public.foundation_health is
  'Foundation verification only; contains no user, tenant, practitioner, client, or clinical data.';

alter table public.foundation_health enable row level security;

-- The proof row is for migration tooling, not for browser or authenticated APIs.
revoke all on table public.foundation_health from public, anon, authenticated;
