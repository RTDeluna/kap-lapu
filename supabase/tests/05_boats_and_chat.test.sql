-- Boat badges, price visibility, papers, dock checks and inquiry chat.
begin;
\ir helpers/act_as.psql

select plan(30);

select tests.make_user('ramon', interval '60 days');   -- boat owner
select tests.make_user('jun', interval '60 days');     -- renter
select tests.make_user('dan', interval '60 days');     -- stranger
select tests.make_user('boss', interval '60 days');    -- admin
update public.profiles set is_admin = true where handle = 'boss';

select tests.act_as('ramon');
insert into public.boats (name, capacity) values ('Bangka Tala', 8) returning id as boat \gset
insert into public.boat_rates (boat_id, day_rate_php, seat_rate_php) values (:'boat', 2500, 350);

-- Drafts --------------------------------------------------------------------

select tests.act_as('dan');
select is((select count(*) from public.boats), 0::bigint, 'A draft boat is invisible to others');

select tests.act_as_anon();
select is((select count(*) from public.boats), 0::bigint, 'A draft boat is invisible signed out');

select tests.act_as('ramon');

select throws_ok(
  format($$ update public.boats set badge = 'licensed' where id = %L $$, :'boat'),
  '42501',
  null,
  'An owner cannot give his own boat a badge'
);

select throws_ok(
  format($$ update public.boats set wave_limit_m = 0.8 where id = %L $$, :'boat'),
  '23514',
  null,
  'An owner cannot raise the wave limit above 0.5 m'
);

select throws_ok(
  format($$ select public.start_inquiry(%L) $$, :'boat'),
  'P0001',
  'Hindi mahanap ang bangka.',
  'Nobody can message about a draft boat'
);

-- Badges --------------------------------------------------------------------

select tests.act_as('boss');

select throws_ok(
  format($$ select public.admin_set_boat_badge(%L, 'verified') $$, :'boat'),
  'P0001',
  'The owner needs a passed dock ID check first.',
  'Verified needs a dock ID check'
);

select public.admin_record_dock_check(tests.uid('ramon'), 'philsys_card', true);

select ok(
  (select is_owner from public.profiles where handle = 'ramon'),
  'A passed dock check marks the person as an owner'
);

select lives_ok(
  format($$ select public.admin_set_boat_badge(%L, 'verified') $$, :'boat'),
  'With a dock check the boat can be verified'
);

select tests.act_as('dan');

select is((select count(*) from public.boats), 1::bigint, 'A verified boat is listed');
select is((select count(*) from public.boat_rates), 0::bigint, 'A verified boat shows no prices');
select is((select count(*) from public.dock_checks), 0::bigint, 'Strangers never see dock checks');

select tests.act_as('ramon');
select is((select count(*) from public.dock_checks), 1::bigint, 'An owner sees his own dock check');

select throws_ok(
  $$ update public.dock_checks set passed = true $$,
  '42501',
  null,
  'Dock checks cannot be edited through the API'
);

select tests.act_as('boss');

insert into public.boat_papers (boat_id, kind, expires_on) values
  (:'boat', 'marina_registration', current_date + 300),
  (:'boat', 'safety_certificate', current_date + 200),
  (:'boat', 'passenger_insurance', current_date - 1),
  (:'boat', 'cpc', current_date + 100);

select throws_ok(
  format($$ select public.admin_set_boat_badge(%L, 'licensed') $$, :'boat'),
  'P0001',
  'Licensed needs a current MARINA registration, safety certificate, passenger insurance and CPC.',
  'Licensed is refused while any paper is expired'
);

update public.boat_papers set expires_on = current_date + 365 where kind = 'passenger_insurance';

select lives_ok(
  format($$ select public.admin_set_boat_badge(%L, 'licensed') $$, :'boat'),
  'With four current papers the boat is Licensed'
);

select tests.act_as('dan');
select is((select day_rate_php from public.boat_rates), 2500, 'A Licensed boat shows its prices');
select is((select count(*) from public.boat_papers), 0::bigint, 'Strangers never see boat papers');

-- Rate jumps ----------------------------------------------------------------

select tests.act_as('ramon');
update public.boat_rates set seat_rate_php = 380 where boat_id = :'boat';

select tests.act_as('dan');
select is((select seat_rate_php from public.boat_rates), 380, 'A small price change shows right away');

select tests.act_as('ramon');
update public.boat_rates set seat_rate_php = 600 where boat_id = :'boat';

select tests.act_as('dan');
select is((select count(*) from public.boat_rates), 0::bigint, 'A price jump over 30% hides prices until a recheck');

select tests.act_as('boss');
select public.admin_set_boat_badge(:'boat', 'licensed');

select tests.act_as('dan');
select is((select seat_rate_php from public.boat_rates), 600, 'Relicensing is the recheck and shows prices again');

-- Lapsed papers -------------------------------------------------------------

select tests.act_as_postgres();
update public.boat_papers set expires_on = current_date - 1 where kind = 'cpc';

select is(private.expire_lapsed_licenses(), 1, 'The nightly check finds the lapsed boat');
select is((select badge::text from public.boats where id = :'boat'), 'verified', 'A lapsed boat drops to verified');

-- Inquiry chat --------------------------------------------------------------

select tests.act_as('jun');
select public.start_inquiry(:'boat') as convo \gset

select is(public.start_inquiry(:'boat'), :'convo'::uuid, 'Asking again reuses the same conversation');

insert into public.messages (conversation_id, body) values (:'convo', 'Kuya, pwede po ba sa Sabado, 4 kami?');
insert into public.messages (conversation_id, body) values (:'convo', 'Pa-send po ng OTP para ma confirm');

select tests.act_as('ramon');
insert into public.messages (conversation_id, body) values (:'convo', 'Send ka muna 500 sa GCash 0917 123 4567');
insert into public.messages (conversation_id, body) values (:'convo', 'Reserve mo na, advance lang');

select set_eq(
  $$ select coalesce(flag_reason, 'clean') from public.messages order by created_at $$,
  array['clean', 'otp', 'number', 'payment'],
  'The filter flags OTP requests, phone numbers and pay first talk, and leaves plain questions alone'
);

select is(private.payment_talk_reason('Tingnan mo www.laot-promo.com'), 'link', 'Links are flagged');
select is(private.payment_talk_reason('Kita kits sa Porto, 5:00 AM'), null, 'A meeting time is not flagged');

select throws_ok(
  format($$ insert into public.messages (conversation_id, body, flagged) values (%L, 'hi', false) $$, :'convo'),
  '42501',
  null,
  'Senders cannot clear the flag themselves'
);

select tests.act_as('dan');
select is((select count(*) from public.messages), 0::bigint, 'Outsiders read no messages');

select throws_ok(
  format($$ insert into public.messages (conversation_id, body) values (%L, 'Hello') $$, :'convo'),
  '42501',
  null,
  'Outsiders cannot post into a conversation'
);

select tests.act_as('ramon');
insert into public.blocks (blocked_id) values (tests.uid('jun'));

select tests.act_as('jun');

select throws_ok(
  format($$ insert into public.messages (conversation_id, body) values (%L, 'Hello po?') $$, :'convo'),
  '42501',
  null,
  'A blocked renter cannot keep messaging'
);

select * from finish();
rollback;
