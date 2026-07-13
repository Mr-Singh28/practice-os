-- Deterministic, synthetic foundation data only. Never place real user or
-- clinical information in this seed file.
insert into public.foundation_health (id, status, seeded_at)
values (1, 'ready', timestamptz '2000-01-01 00:00:00+00')
on conflict (id) do update
set
  status = excluded.status,
  seeded_at = excluded.seeded_at;
