-- Boats, rates, papers, dock ID checks and inquiry chat. Stage 1: no trips,
-- bookings or payments exist yet, so nothing here moves money.
--
-- No ID image, selfie or document scan is ever stored. A dock check records only
-- the result, the kind of ID, the date and who checked. Boat papers record only the
-- kind, an optional reference number, the expiry date and who checked them.

create type public.paper_kind as enum (
  'marina_registration', 'safety_certificate', 'passenger_insurance', 'cpc',
  'mayors_permit', 'dot_accreditation'
);

create type public.id_check_kind as enum (
  'philsys_card', 'ephilid', 'digital_national_id', 'other_government_id'
);

-- Boats ---------------------------------------------------------------------

create table public.boats (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  coordinator_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  home_port text not null default 'Porto, Brgy. Balon, Mariveles' check (char_length(home_port) <= 120),
  capacity integer not null check (capacity between 1 and 60),
  -- 0.5 m is the limit reported for passenger motorbancas. Owners may go lower, never higher.
  wave_limit_m numeric(3, 2) not null default 0.50 check (wave_limit_m > 0 and wave_limit_m <= 0.50),
  badge public.boat_badge not null default 'none',
  rates_need_review boolean not null default false,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  check (coordinator_id is null or coordinator_id <> owner_id)
);

create index boats_owner_idx on public.boats (owner_id);
create index boats_coordinator_idx on public.boats (coordinator_id) where coordinator_id is not null;
alter table public.boats enable row level security;

create function private.manages_boat(p_boat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.boats b
    where b.id = p_boat_id
      and (b.owner_id = (select auth.uid()) or b.coordinator_id = (select auth.uid()))
  );
$$;

create policy "listed boats are public, drafts are private"
  on public.boats for select
  to anon, authenticated
  using (
    (badge in ('verified', 'licensed') and hidden_at is null and not private.blocked_with(owner_id))
    or owner_id = (select auth.uid())
    or coordinator_id = (select auth.uid())
    or private.is_admin()
  );

create policy "owners add draft boats"
  on public.boats for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and badge = 'none');

create policy "owners and coordinators edit boats"
  on public.boats for update
  to authenticated
  using (owner_id = (select auth.uid()) or coordinator_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) or coordinator_id = (select auth.uid()));

create policy "owners delete boats"
  on public.boats for delete
  to authenticated
  using (owner_id = (select auth.uid()));

revoke all on table public.boats from anon, authenticated;
grant select on table public.boats to anon, authenticated;
grant insert (name, home_port, capacity, wave_limit_m) on table public.boats to authenticated;
grant update (name, home_port, capacity, wave_limit_m) on table public.boats to authenticated;
grant delete on table public.boats to authenticated;

-- Rates ---------------------------------------------------------------------
-- Prices show only on Licensed boats, and disappear after a jump of more than 30%
-- until an admin rechecks the listing.

create table public.boat_rates (
  boat_id uuid primary key references public.boats (id) on delete cascade,
  day_rate_php integer check (day_rate_php between 500 and 100000),
  seat_rate_php integer check (seat_rate_php between 50 and 20000),
  updated_at timestamptz not null default now(),
  check (day_rate_php is not null or seat_rate_php is not null)
);

alter table public.boat_rates enable row level security;

create policy "rates show on licensed boats"
  on public.boat_rates for select
  to anon, authenticated
  using (
    private.manages_boat(boat_id)
    or private.is_admin()
    or exists (
      select 1 from public.boats b
      where b.id = boat_id
        and b.badge = 'licensed'
        and not b.rates_need_review
        and b.hidden_at is null
        and not private.blocked_with(b.owner_id)
    )
  );

create policy "owners and coordinators set rates"
  on public.boat_rates for insert
  to authenticated
  with check (private.manages_boat(boat_id));

create policy "owners and coordinators change rates"
  on public.boat_rates for update
  to authenticated
  using (private.manages_boat(boat_id))
  with check (private.manages_boat(boat_id));

revoke all on table public.boat_rates from anon, authenticated;
grant select on table public.boat_rates to anon, authenticated;
grant insert (boat_id, day_rate_php, seat_rate_php) on table public.boat_rates to authenticated;
grant update (day_rate_php, seat_rate_php) on table public.boat_rates to authenticated;

create function private.big_change(p_old integer, p_new integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_old is not null and p_new is not null and p_old > 0
     and abs(p_new - p_old)::numeric / p_old > 0.30;
$$;

create function private.flag_rate_jumps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if private.big_change(old.day_rate_php, new.day_rate_php)
     or private.big_change(old.seat_rate_php, new.seat_rate_php) then
    update public.boats set rates_need_review = true where id = new.boat_id;
  end if;
  return new;
end;
$$;

create trigger boat_rates_flag_jumps
  before update on public.boat_rates
  for each row execute function private.flag_rate_jumps();

-- Papers --------------------------------------------------------------------
-- Checked in person by an admin. Only the facts are kept, never a scan.

create table public.boat_papers (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats (id) on delete cascade,
  kind public.paper_kind not null,
  reference_no text check (char_length(reference_no) <= 80),
  expires_on date not null,
  checked_by uuid not null default auth.uid() references public.profiles (id),
  checked_at timestamptz not null default now(),
  unique (boat_id, kind)
);

alter table public.boat_papers enable row level security;

create policy "owners, coordinators and admins see papers"
  on public.boat_papers for select
  to authenticated
  using (private.manages_boat(boat_id) or private.is_admin());

create policy "admins record papers"
  on public.boat_papers for insert
  to authenticated
  with check (private.is_admin() and checked_by = (select auth.uid()));

create policy "admins update papers"
  on public.boat_papers for update
  to authenticated
  using (private.is_admin())
  with check (private.is_admin() and checked_by = (select auth.uid()));

revoke all on table public.boat_papers from anon, authenticated;
grant select on table public.boat_papers to authenticated;
grant insert (boat_id, kind, reference_no, expires_on) on table public.boat_papers to authenticated;
grant update (reference_no, expires_on, checked_by, checked_at) on table public.boat_papers to authenticated;

-- Dock ID checks ------------------------------------------------------------
-- The National ID QR check at everify.gov.ph, done in person at Porto.
-- Append only through the API: no update or delete grants.

create table public.dock_checks (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.profiles (id) on delete cascade,
  id_kind public.id_check_kind not null,
  passed boolean not null,
  checked_by uuid not null default auth.uid() references public.profiles (id),
  checked_at timestamptz not null default now(),
  note text check (char_length(note) <= 280)
);

create index dock_checks_person_idx on public.dock_checks (person_id, checked_at desc);
alter table public.dock_checks enable row level security;

create policy "people see their own dock checks, admins see all"
  on public.dock_checks for select
  to authenticated
  using (person_id = (select auth.uid()) or private.is_admin());

create policy "admins record dock checks"
  on public.dock_checks for insert
  to authenticated
  with check (private.is_admin() and checked_by = (select auth.uid()));

revoke all on table public.dock_checks from anon, authenticated;
grant select on table public.dock_checks to authenticated;
grant insert (person_id, id_kind, passed, note) on table public.dock_checks to authenticated;

-- Inquiry chat --------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  boat_id uuid not null references public.boats (id) on delete cascade,
  renter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (boat_id, renter_id)
);

create index conversations_renter_idx on public.conversations (renter_id);
alter table public.conversations enable row level security;

create function private.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.boats b on b.id = c.boat_id
    where c.id = p_conversation_id
      and (select auth.uid()) in (c.renter_id, b.owner_id, b.coordinator_id)
  );
$$;

create function private.conversation_blocked(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations c
    join public.boats b on b.id = c.boat_id
    where c.id = p_conversation_id
      and (
        private.blocked_with(c.renter_id)
        or private.blocked_with(b.owner_id)
        or (b.coordinator_id is not null and private.blocked_with(b.coordinator_id))
      )
  );
$$;

create policy "members see their conversations"
  on public.conversations for select
  to authenticated
  using (private.is_conversation_member(id));

revoke all on table public.conversations from anon, authenticated;
grant select on table public.conversations to authenticated;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  flagged boolean not null default false,
  flag_reason text,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
alter table public.messages enable row level security;

create policy "members read messages"
  on public.messages for select
  to authenticated
  using (
    private.is_conversation_member(conversation_id)
    and (hidden_at is null or sender_id = (select auth.uid()))
  );

create policy "members send messages unless blocked"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and private.is_conversation_member(conversation_id)
    and not private.conversation_blocked(conversation_id)
  );

revoke all on table public.messages from anon, authenticated;
grant select on table public.messages to authenticated;
grant insert (conversation_id, body) on table public.messages to authenticated;

-- The scam filter. It never blocks a message; it flags it so the app shows the
-- warning card, and the flag feeds the report queue. Order matters: the first
-- matching reason wins.
create function private.payment_talk_reason(p_body text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when lower(p_body) ~ '\motp\M|one[ -]?time[ -]?(pin|password|code)|verification code|\mpin code\M'
      then 'otp'
    when p_body ~ '(\+?63|\m0)9\d{2}[ .-]?\d{3}[ .-]?\d{4}|\d([ .-]?\d){9,}'
      then 'number'
    when lower(p_body) ~ '\m(gcash|g-cash|maya|paymaya|palawan|cebuana|padala|bank transfer|bdo|bpi|metrobank|landbank|unionbank)\M|\m(advance|down ?payment|dp|deposit|reservation fee)\M|bayad (na )?muna|magbayad (muna|bago)|send (money|payment)'
      then 'payment'
    when lower(p_body) ~ 'https?://|www\.|\m[a-z0-9-]+\.(com|ph|net|org|ly|me|link|app|io)\M'
      then 'link'
  end;
$$;

create function private.flag_payment_talk()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.flag_reason := private.payment_talk_reason(new.body);
  new.flagged := new.flag_reason is not null;
  return new;
end;
$$;

create trigger messages_flag_payment_talk
  before insert on public.messages
  for each row execute function private.flag_payment_talk();

-- start_inquiry() -----------------------------------------------------------

create function public.start_inquiry(p_boat_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_boat public.boats%rowtype;
  v_id uuid;
begin
  if v_uid is null then
    raise exception using message = 'Mag sign in muna para mag message.', hint = 'auth_required';
  end if;

  select * into v_boat from public.boats where id = p_boat_id;

  if not found or v_boat.badge = 'none' or v_boat.hidden_at is not null then
    raise exception using message = 'Hindi mahanap ang bangka.', hint = 'not_found';
  end if;

  if v_uid in (v_boat.owner_id, v_boat.coordinator_id) then
    raise exception using message = 'Bangka mo ito.', hint = 'own_boat';
  end if;

  if private.blocked_with(v_boat.owner_id)
     or (v_boat.coordinator_id is not null and private.blocked_with(v_boat.coordinator_id)) then
    raise exception using message = 'Hindi ka maka message sa bangkang ito.', hint = 'blocked';
  end if;

  insert into public.conversations (boat_id, renter_id)
  values (p_boat_id, v_uid)
  on conflict (boat_id, renter_id) do nothing
  returning id into v_id;

  if v_id is null then
    select c.id into v_id from public.conversations c
    where c.boat_id = p_boat_id and c.renter_id = v_uid;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.start_inquiry from anon, public;
grant execute on function public.start_inquiry to authenticated;

-- Realtime for chat, only where the Supabase publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
