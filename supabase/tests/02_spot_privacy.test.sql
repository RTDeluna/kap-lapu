-- Who sees which spot, and who ever receives an exact point.
begin;
\ir helpers/act_as.psql

select plan(27);

-- ana pins; ben is an accepted follower; cara asked but was not accepted;
-- dan is a stranger; eve is blocked by ana.
select tests.make_user('ana', interval '60 days');
select tests.make_user('ben', interval '60 days');
select tests.make_user('cara', interval '60 days');
select tests.make_user('dan', interval '60 days');
select tests.make_user('eve', interval '60 days');

select tests.act_as('ana');
select public.pin_spot('Secret rocks', 14.4400, 120.4900, 'private') as private_spot \gset
select public.pin_spot('Barkada reef', 14.4450, 120.4950, 'followers') as followers_spot \gset
select public.pin_spot('Sisiman seawall', 14.4500, 120.5000, 'public', '{shore}', '{talakitok}') as public_spot \gset
insert into public.blocks (blocked_id) values (tests.uid('eve'));

select tests.act_as('ben');
insert into public.follows (followee_id) values (tests.uid('ana'));
select tests.act_as('cara');
insert into public.follows (followee_id) values (tests.uid('ana'));
select tests.act_as('ana');
update public.follows set status = 'accepted' where follower_id = tests.uid('ben');

-- The author ---------------------------------------------------------------

select tests.act_as('ana');

select is(
  (select count(*) from public.nearby_spots(14.44, 120.49)),
  3::bigint,
  'The author sees all three of her spots'
);

select ok(
  (select bool_and(is_exact) from public.nearby_spots(14.44, 120.49)),
  'The author always gets her exact points'
);

select ok(
  (select tests.meters(lat, lng, 14.4500, 120.5000) < 0.01
   from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  'The author''s exact point is the point she pinned'
);

-- An accepted follower -----------------------------------------------------

select tests.act_as('ben');

select set_eq(
  $$ select name from public.nearby_spots(14.44, 120.49) $$,
  array['Barkada reef', 'Sisiman seawall'],
  'An accepted follower sees the followers spot and the public spot, not the private one'
);

select ok(
  (select is_exact from public.nearby_spots(14.44, 120.49) where id = :'followers_spot'),
  'An accepted follower gets the exact point of a followers spot'
);

select ok(
  not (select is_exact from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  'An accepted follower still gets only the area on a public spot'
);

select is(
  (select count(*) from public.spot_locations),
  1::bigint,
  'An accepted follower can read exactly one exact point'
);

-- A pending follower and a stranger ----------------------------------------

select tests.act_as('cara');

select set_eq(
  $$ select name from public.nearby_spots(14.44, 120.49) $$,
  array['Sisiman seawall'],
  'A pending follower sees only the public spot'
);

select is(
  (select count(*) from public.spot_locations),
  0::bigint,
  'A pending follower reads no exact points'
);

select is(
  (select status::text from public.follows where follower_id = tests.uid('cara')),
  'pending',
  'Her follow is still pending'
);

update public.follows set status = 'accepted' where follower_id = tests.uid('cara');

select is(
  (select status::text from public.follows where follower_id = tests.uid('cara')),
  'pending',
  'A follower cannot accept their own follow'
);

select throws_ok(
  format(
    $$ insert into public.follows (followee_id, status) values (%L, 'accepted') $$,
    tests.uid('dan')
  ),
  '42501',
  null,
  'A follow cannot be created as already accepted'
);

select tests.act_as('dan');

select set_eq(
  $$ select name from public.nearby_spots(14.44, 120.49) $$,
  array['Sisiman seawall'],
  'A stranger sees only the public spot'
);

select ok(
  (select tests.meters(lat, lng, 14.4500, 120.5000) between 100 and 400
   from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  'A stranger gets an area center 100 to 400 m from the real point'
);

select ok(
  (select area_radius_m = 500 from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  'The public circle is 500 m in radius, so the real point is always inside it'
);

select is(
  (select lat from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  (select lat from public.nearby_spots(14.44, 120.49) where id = :'public_spot'),
  'The area center is fixed, so repeated reads reveal nothing new'
);

select is(
  (select count(*) from public.get_spot(:'private_spot')),
  0::bigint,
  'A stranger cannot open a private spot by id'
);

select is(
  (select count(*) from public.get_spot(:'followers_spot')),
  0::bigint,
  'A stranger cannot open a followers spot by id'
);

select ok(
  not (select is_exact from public.get_spot(:'public_spot')),
  'A stranger opening a public spot gets the area, not the point'
);

-- The blocked user ---------------------------------------------------------

select tests.act_as('eve');

select is(
  (select count(*) from public.nearby_spots(14.44, 120.49)),
  0::bigint,
  'Someone ana blocked sees none of her spots'
);

select is(
  (select count(*) from public.profiles where handle = 'ana'),
  0::bigint,
  'Someone ana blocked cannot see her profile'
);

-- Signed out ---------------------------------------------------------------

select tests.act_as_anon();

select set_eq(
  $$ select name from public.nearby_spots(14.44, 120.49) $$,
  array['Sisiman seawall'],
  'Signed out people see only public spots'
);

select is(
  (select count(*) from public.spot_locations),
  0::bigint,
  'Signed out people read no exact points'
);

-- Writes that must fail ----------------------------------------------------

select tests.act_as('ana');

select throws_ok(
  format($$ update public.spot_locations set point = point where spot_id = %L $$, :'public_spot'),
  '42501',
  null,
  'An exact point can never be moved'
);

select throws_ok(
  $$ insert into public.spots (author_id, name, area_center)
     values (auth.uid(), 'Sneaky', 'SRID=4326;POINT(120.49 14.44)') $$,
  '42501',
  null,
  'Spots can only be created through pin_spot'
);

-- Blocking an accepted follower ends the follow ----------------------------

insert into public.blocks (blocked_id) values (tests.uid('ben'));
select tests.act_as('ben');

select is(
  (select count(*) from public.nearby_spots(14.44, 120.49)),
  0::bigint,
  'After ana blocks ben he sees none of her spots'
);

select tests.act_as_postgres();

select is(
  (select count(*) from public.follows where follower_id = tests.uid('ben')),
  0::bigint,
  'Blocking removed the follow, so unblocking does not restore exact points'
);

select * from finish();
rollback;
