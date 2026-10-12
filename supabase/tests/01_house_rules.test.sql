-- House rules that must hold for every table and function, now and later.
begin;
\ir helpers/act_as.psql

select plan(10);

select tables_are(
  'public',
  array[
    'profiles', 'blocks', 'follows', 'protected_zones', 'spots', 'spot_locations',
    'saved_spots', 'catches', 'catch_likes', 'comments', 'boats', 'boat_rates',
    'boat_papers', 'dock_checks', 'conversations', 'messages', 'reports', 'audit_events'
  ],
  'Every public table is known. A new table means a new RLS test.'
);

select is(
  (select count(*) from pg_tables where schemaname = 'public' and not rowsecurity),
  0::bigint,
  'RLS is on for every table in public'
);

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
  ),
  0::bigint,
  'Every table in public has at least one policy'
);

select is(
  (
    select count(*)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and not coalesce(
        exists (select 1 from unnest(p.proconfig) cfg where cfg like 'search_path=%'),
        false
      )
  ),
  0::bigint,
  'Every security definer function pins its search_path'
);

-- No column that could hold an ID image, selfie or document scan.
select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name in ('dock_checks', 'boat_papers', 'profiles')
      and column_name ~ '(image|photo|scan|selfie|file|path)'
      and column_name <> 'avatar_path'
  ),
  0::bigint,
  'No ID or paper image columns exist'
);

select hasnt_column('public', 'profiles', 'phone', 'Profiles never copy the phone number');

select tests.act_as_anon();

select throws_ok(
  $$ select public.pin_spot('Test', 14.43, 120.49) $$,
  '42501',
  null,
  'Signed out people cannot pin'
);

select throws_ok(
  $$ select * from auth.users $$,
  '42501',
  null,
  'The API roles cannot read auth.users'
);

select throws_ok(
  $$ select * from public.audit_events $$,
  '42501',
  null,
  'Signed out people cannot read the audit log'
);

select throws_ok(
  $$ select handle from public.profiles where is_admin $$,
  '42501',
  null,
  'Nobody can list which accounts are admins'
);

select * from finish();
rollback;
