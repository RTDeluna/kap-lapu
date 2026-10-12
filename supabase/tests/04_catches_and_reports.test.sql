-- Catches follow their spot; reports hide content after three people flag it.
begin;
\ir helpers/act_as.psql

select plan(24);

select tests.make_user('ana', interval '60 days');
select tests.make_user('ben', interval '60 days');
select tests.make_user('dan', interval '60 days');
select tests.make_user('rep1', interval '60 days');
select tests.make_user('rep2', interval '60 days');
select tests.make_user('rep3', interval '60 days');
select tests.make_user('boss', interval '60 days');
update public.profiles set is_admin = true where handle = 'boss';

select tests.act_as('ana');
select public.pin_spot('Barkada reef', 14.4450, 120.4950, 'followers') as followers_spot \gset
select public.pin_spot('Sisiman seawall', 14.4500, 120.5000, 'public') as public_spot \gset
insert into public.catches (spot_id, species, weight_kg, method)
values (:'followers_spot', 'Talakitok', 2.1, 'popping');
insert into public.catches (spot_id, species, method)
values (:'public_spot', 'Pusit', 'squid jig')
returning id as public_catch \gset

select tests.act_as('ben');
insert into public.follows (followee_id) values (tests.uid('ana'));
select tests.act_as('ana');
update public.follows set status = 'accepted' where follower_id = tests.uid('ben');

-- Catches -------------------------------------------------------------------

select tests.act_as('ben');

select is(
  (select count(*) from public.catches),
  2::bigint,
  'An accepted follower sees catches at both spots'
);

select tests.act_as('dan');

select set_eq(
  $$ select species from public.catches $$,
  array['Pusit'],
  'A stranger sees only the catch at the public spot'
);

select is(
  (select catch_count from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  1,
  'The map counts only catches the caller may see'
);

select throws_ok(
  format($$ insert into public.catches (spot_id, species) values (%L, 'Lapu lapu') $$, :'followers_spot'),
  '42501',
  null,
  'A stranger cannot log a catch at a spot hidden from him'
);

select throws_ok(
  $$ insert into public.catches (species, fresh_capture) values ('Lapu lapu', true) $$,
  '42501',
  null,
  'Nobody can mark their own catch as a fresh capture'
);

select lives_ok(
  format($$ insert into public.catches (spot_id, species) values (%L, 'Bisugo') $$, :'public_spot'),
  'A stranger can log a catch at a public spot'
);

select lives_ok(
  format($$ insert into public.comments (catch_id, body) values (%L, 'Galing!') $$, :'public_catch'),
  'People comment on catches they can see'
);

select lives_ok(
  format($$ insert into public.catch_likes (catch_id) values (%L) $$, :'public_catch'),
  'People like catches they can see'
);

-- Deleting a spot keeps the catches but drops the link, so no location leaks.
select tests.act_as('ana');
delete from public.spots where id = :'followers_spot';

select is(
  (select count(*) from public.catches where species = 'Talakitok' and spot_id is null),
  1::bigint,
  'Deleting a spot keeps its catches without a location'
);

-- Reports -------------------------------------------------------------------

select tests.act_as('rep1');
insert into public.reports (target_kind, target_id, reason) values ('catch', :'public_catch', 'Fake catch');

select throws_ok(
  format($$ insert into public.reports (target_kind, target_id, reason) values ('catch', %L, 'Again') $$, :'public_catch'),
  '23505',
  null,
  'One person reports a thing once'
);

select tests.act_as('rep2');
insert into public.reports (target_kind, target_id, reason) values ('catch', :'public_catch', 'Fake catch');

select tests.act_as('dan');
select is(
  (select count(*) from public.catches where id = :'public_catch'),
  1::bigint,
  'Two reports do not hide a catch'
);

select tests.act_as('rep3');
insert into public.reports (target_kind, target_id, reason) values ('catch', :'public_catch', 'Old photo');

select tests.act_as('dan');
select is(
  (select count(*) from public.catches where id = :'public_catch'),
  0::bigint,
  'Three reports from three people hide a catch'
);

select tests.act_as('ana');
select is(
  (select count(*) from public.catches where id = :'public_catch'),
  1::bigint,
  'The angler still sees her hidden catch'
);

select is(
  (select count(*) from public.reports),
  0::bigint,
  'People never see reports about their own posts'
);

select tests.act_as('rep3');
select is(
  (select count(*) from public.reports),
  1::bigint,
  'A reporter sees only their own report'
);

select throws_ok(
  format($$ insert into public.reports (target_kind, target_id, reason) values ('spot', %L, 'Hidden spot') $$, gen_random_uuid()),
  'P0001',
  'Hindi mahanap ang ire-report mo.',
  'Nobody can report something they cannot see'
);

select throws_ok(
  format($$ select public.admin_resolve_report(id, false) from public.reports limit 1 $$),
  '42501',
  'Admins only.',
  'Only admins resolve reports'
);

select tests.act_as('boss');
select public.admin_resolve_report(
  (select id from public.reports where reporter_id = tests.uid('rep1')),
  false
);

select is(
  (select count(*) from public.reports where status = 'open' and target_id = :'public_catch'),
  0::bigint,
  'Dismissing one report closes every open report on that catch'
);

select tests.act_as('dan');
select is(
  (select count(*) from public.catches where id = :'public_catch'),
  1::bigint,
  'A dismissed catch is visible again'
);

select tests.act_as('boss');
select is(
  (select action from public.audit_events order by id desc limit 1),
  'report.dismissed',
  'The decision is in the audit log'
);

select throws_ok(
  $$ insert into public.audit_events (action, target_kind) values ('forged', 'x') $$,
  '42501',
  null,
  'Not even an admin writes the audit log directly'
);

select throws_ok(
  $$ delete from public.audit_events $$,
  '42501',
  null,
  'Nobody deletes from the audit log through the API'
);

select tests.act_as('dan');

select throws_ok(
  $$ update public.profiles set is_admin = true where id = auth.uid() $$,
  '42501',
  null,
  'Nobody makes themselves an admin'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Dan the angler' where id = auth.uid() $$,
  'People can edit their own display name'
);

select * from finish();
rollback;
