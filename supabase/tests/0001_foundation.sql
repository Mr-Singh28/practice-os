begin;

select plan(6);

select has_table(
  'public',
  'foundation_health',
  'foundation migration creates the proof table'
);

select columns_are(
  'public',
  'foundation_health',
  array['id', 'status', 'seeded_at'],
  'foundation proof table has only the expected columns'
);

select col_is_pk(
  'public',
  'foundation_health',
  'id',
  'foundation proof table uses a singleton primary key'
);

select ok(
  (
    select c.relrowsecurity
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'foundation_health'
  ),
  'row-level security is enabled on the proof table'
);

select is(
  has_table_privilege('anon', 'public.foundation_health', 'select'),
  false,
  'anonymous clients cannot select from the proof table'
);

select results_eq(
  $$ select status from public.foundation_health where id = 1 $$,
  array['ready']::text[],
  'the deterministic foundation seed was loaded'
);

select * from finish();

rollback;
