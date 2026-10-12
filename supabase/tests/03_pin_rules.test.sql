-- The rules pin_spot() enforces: geofence, rate limits, name checks, on site badge.
begin;
\ir helpers/act_as.psql

select plan(12);

select tests.make_user('veteran', interval '90 days');
select tests.make_user('newbie', interval '2 days');

-- A made up test zone, roughly 1 km square. Not a real sanctuary boundary.
insert into public.protected_zones (name, kind, area, reason, source)
values (
  'Test sanctuary',
  'sanctuary',
  'SRID=4326;MULTIPOLYGON(((120.500 14.400, 120.510 14.400, 120.510 14.410, 120.500 14.410, 120.500 14.400)))',
  'Bawal mag pin dito. Fish sanctuary ito, protektado ng batas.',
  'pgTAP fixture'
);

select tests.act_as('veteran');

select throws_ok(
  $$ select public.pin_spot('Inside', 14.405, 120.505) $$,
  'P0001',
  'Bawal mag pin dito. Fish sanctuary ito, protektado ng batas.',
  'A pin inside a protected zone is refused with the zone''s reason'
);

select lives_ok(
  $$ select public.pin_spot('Outside', 14.420, 120.505) $$,
  'A pin outside every zone is accepted'
);

select throws_ok(
  $$ select public.pin_spot('   ', 14.420, 120.505) $$,
  'P0001',
  'Lagyan ng pangalan ang spot, hanggang 80 letra.',
  'A blank name is refused'
);

select throws_ok(
  $$ select public.pin_spot('Nowhere', 95, 120.505) $$,
  'P0001',
  'Hindi mabasa ang lokasyon ng pin. Subukan ulit.',
  'An impossible latitude is refused'
);

-- Pinned on site ------------------------------------------------------------

select public.pin_spot('Standing here', 14.430, 120.480, 'public', '{}', '{}', null, 14.431, 120.481) as near_spot \gset
select public.pin_spot('From home', 14.430, 120.480, 'public', '{}', '{}', null, 14.600, 120.900) as far_spot \gset
select public.pin_spot('No GPS', 14.430, 120.480) as no_gps_spot \gset

select ok(
  (select pinned_on_site from public.spots where id = :'near_spot'),
  'A pin made within 300 m of the phone''s GPS fix is pinned on site'
);

select ok(
  not (select pinned_on_site from public.spots where id = :'far_spot'),
  'A pin made from far away is not pinned on site'
);

select ok(
  not (select pinned_on_site from public.spots where id = :'no_gps_spot'),
  'A pin without a GPS fix is not pinned on site'
);

select is(
  (select count(*) from information_schema.columns
   where table_schema = 'public' and column_name ~ 'device'),
  0::bigint,
  'The phone''s own location is never stored'
);

-- Rate limits ---------------------------------------------------------------

select tests.act_as('newbie');
select public.pin_spot('One', 14.420, 120.480);
select public.pin_spot('Two', 14.421, 120.480);
select public.pin_spot('Three', 14.422, 120.480);

select throws_ok(
  $$ select public.pin_spot('Four', 14.423, 120.480) $$,
  'P0001',
  'Hanggang 3 spot muna kada linggo para sa bagong account. Subukan ulit sa susunod na linggo.',
  'A new account is held to 3 pins a week'
);

select tests.act_as('veteran');

select lives_ok(
  $$ select public.pin_spot('Fifth for veteran', 14.424, 120.480) $$,
  'An older account can pin more than 3 a week'
);

-- Defense in depth ----------------------------------------------------------

select tests.act_as_postgres();

select throws_ok(
  $$ insert into public.spot_locations (spot_id, point)
     select id, 'SRID=4326;POINT(120.505 14.405)' from public.spots where name = 'Outside' $$,
  'P0001',
  'Bawal mag pin dito. Fish sanctuary ito, protektado ng batas.',
  'The geofence also guards inserts that skip pin_spot'
);

select tests.act_as('veteran');

select throws_ok(
  $$ insert into public.protected_zones (name, kind, area, reason, source)
     values ('Fake', 'other', 'SRID=4326;MULTIPOLYGON(((120 14, 120.1 14, 120.1 14.1, 120 14, 120 14)))', 'x', 'x') $$,
  '42501',
  null,
  'Only admins can draw protected zones'
);

select * from finish();
rollback;
