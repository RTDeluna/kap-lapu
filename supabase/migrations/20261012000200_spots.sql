-- Follows, protected zones, spots and the functions the map calls.
--
-- Spot privacy rests on one split: `spots` holds what may be shown (name, tags and a
-- fixed offset area center), `spot_locations` holds the exact point. RLS on
-- spot_locations lets only the author, and accepted followers of a followers only
-- spot, read the exact point. Nobody else ever receives it, admins included.

-- Follows -------------------------------------------------------------------
-- A follow starts pending and only the followee can accept it. Without approval,
-- "followers only" would mean "anyone who taps Follow".

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  status public.follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);
alter table public.follows enable row level security;

create function private.i_follow(p_author uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.follows f
    where f.follower_id = (select auth.uid())
      and f.followee_id = p_author
      and f.status = 'accepted'
  );
$$;

create function private.stamp_follow_accept()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    new.accepted_at := now();
  elsif new.status = 'pending' then
    new.accepted_at := null;
  end if;
  return new;
end;
$$;

create trigger follows_stamp_accept
  before update on public.follows
  for each row execute function private.stamp_follow_accept();

-- Blocking someone ends any follow between the two people, both ways.
create function private.drop_follows_on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.follows f
  where (f.follower_id = new.blocker_id and f.followee_id = new.blocked_id)
     or (f.follower_id = new.blocked_id and f.followee_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocks_drop_follows
  after insert on public.blocks
  for each row execute function private.drop_follows_on_block();

create policy "people see follows they are part of"
  on public.follows for select
  to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));

create policy "people ask to follow"
  on public.follows for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and status = 'pending'
    and not private.blocked_with(followee_id)
  );

create policy "only the followee answers a follow"
  on public.follows for update
  to authenticated
  using (followee_id = (select auth.uid()))
  with check (followee_id = (select auth.uid()));

create policy "either side ends a follow"
  on public.follows for delete
  to authenticated
  using (follower_id = (select auth.uid()) or followee_id = (select auth.uid()));

revoke all on table public.follows from anon, authenticated;
grant select, delete on table public.follows to authenticated;
grant insert (followee_id) on table public.follows to authenticated;
grant update (status) on table public.follows to authenticated;

-- Protected zones -----------------------------------------------------------
-- Sanctuaries, port zones and the Coast Guard area. A pin inside one is refused.
-- Boundaries must come from an official source (Mariveles MAO, PCG, MARINA); the
-- `source` column says which. None are seeded here on purpose.

create table public.protected_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  kind public.zone_kind not null,
  area extensions.geography(multipolygon, 4326) not null,
  reason text not null check (char_length(reason) between 1 and 200),
  source text not null check (char_length(source) between 1 and 300),
  created_at timestamptz not null default now()
);

create index protected_zones_area_idx on public.protected_zones using gist (area);
alter table public.protected_zones enable row level security;

create policy "zones are public"
  on public.protected_zones for select
  to anon, authenticated
  using (true);

create policy "admins manage zones"
  on public.protected_zones for all
  to authenticated
  using (private.is_admin())
  with check (private.is_admin());

revoke all on table public.protected_zones from anon, authenticated;
grant select on table public.protected_zones to anon, authenticated;
grant insert, update, delete on table public.protected_zones to authenticated;

-- Spots ---------------------------------------------------------------------

create table public.spots (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  notes text check (char_length(notes) <= 1000),
  visibility public.spot_visibility not null default 'public',
  area_center extensions.geography(point, 4326) not null,
  area_radius_m integer not null default 500 check (area_radius_m between 250 and 2000),
  methods text[] not null default '{}' check (cardinality(methods) <= 10),
  species text[] not null default '{}' check (cardinality(species) <= 20),
  pinned_on_site boolean not null default false,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);

create index spots_area_center_idx on public.spots using gist (area_center);
create index spots_author_created_idx on public.spots (author_id, created_at desc);
alter table public.spots enable row level security;

create table public.spot_locations (
  spot_id uuid primary key references public.spots (id) on delete cascade,
  point extensions.geography(point, 4326) not null
);

alter table public.spot_locations enable row level security;

-- One source of truth for "may the caller see this spot at all".
create function private.can_see_spot(p_spot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.spots s
    where s.id = p_spot_id
      and (
        s.author_id = (select auth.uid())
        or (
          s.hidden_at is null
          and not private.blocked_with(s.author_id)
          and (
            s.visibility = 'public'
            or (s.visibility = 'followers' and private.i_follow(s.author_id))
          )
        )
        or (s.visibility = 'public' and private.is_admin())
      )
  );
$$;

-- "May the caller see the exact point." Admins are left out on purpose.
create function private.can_see_exact_point(p_spot_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.spots s
    where s.id = p_spot_id
      and (
        s.author_id = (select auth.uid())
        or (
          s.visibility = 'followers'
          and s.hidden_at is null
          and not private.blocked_with(s.author_id)
          and private.i_follow(s.author_id)
        )
      )
  );
$$;

create policy "spots follow their visibility"
  on public.spots for select
  to anon, authenticated
  using (private.can_see_spot(id));

create policy "authors edit their spots"
  on public.spots for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "authors delete their spots"
  on public.spots for delete
  to authenticated
  using (author_id = (select auth.uid()));

create policy "exact points only for the author and accepted followers"
  on public.spot_locations for select
  to authenticated
  using (private.can_see_exact_point(spot_id));

-- New spots only come in through pin_spot(). The exact point never changes:
-- to move a pin, delete it and pin again (a new offset is fair for a new point).
revoke all on table public.spots from anon, authenticated;
grant select on table public.spots to anon, authenticated;
grant update (name, notes, visibility, methods, species) on table public.spots to authenticated;
grant delete on table public.spots to authenticated;

-- anon keeps the select grant so the map functions can left join it, but no policy
-- covers anon, so anon always reads zero rows here.
revoke all on table public.spot_locations from anon, authenticated;
grant select on table public.spot_locations to anon, authenticated;

-- Geofence, enforced on every insert path, not just pin_spot().
create function private.refuse_protected_points()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text;
begin
  select z.reason into v_reason
  from public.protected_zones z
  where extensions.st_covers(z.area, new.point)
  limit 1;

  if v_reason is not null then
    raise exception using
      message = v_reason,
      hint = 'protected_zone',
      errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger spot_locations_geofence
  before insert or update on public.spot_locations
  for each row execute function private.refuse_protected_points();

-- Saved spots ---------------------------------------------------------------

create table public.saved_spots (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_id uuid not null references public.spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.saved_spots enable row level security;

create policy "people see their saved spots"
  on public.saved_spots for select
  to authenticated
  using (user_id = (select auth.uid()) and private.can_see_spot(spot_id));

create policy "people save spots they can see"
  on public.saved_spots for insert
  to authenticated
  with check (user_id = (select auth.uid()) and private.can_see_spot(spot_id));

create policy "people unsave their spots"
  on public.saved_spots for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.saved_spots from anon, authenticated;
grant select, delete on table public.saved_spots to authenticated;
grant insert (spot_id) on table public.saved_spots to authenticated;

-- pin_spot() ----------------------------------------------------------------

create function public.pin_spot(
  p_name text,
  p_lat double precision,
  p_lng double precision,
  p_visibility public.spot_visibility default 'public',
  p_methods text[] default '{}',
  p_species text[] default '{}',
  p_notes text default null,
  p_device_lat double precision default null,
  p_device_lng double precision default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_point extensions.geography;
  v_device extensions.geography;
  v_center extensions.geography;
  v_account_age interval;
  v_recent integer;
  v_today integer;
  v_spot_id uuid;
begin
  if v_uid is null then
    raise exception using message = 'Mag sign in muna para mag pin ng spot.', hint = 'auth_required';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception using message = 'Lagyan ng pangalan ang spot, hanggang 80 letra.', hint = 'invalid_name';
  end if;

  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception using message = 'Hindi mabasa ang lokasyon ng pin. Subukan ulit.', hint = 'invalid_point';
  end if;

  -- Rate limits: 20 pins a day for anyone, 3 a week while an account is under 30 days old.
  select now() - p.created_at into v_account_age
  from public.profiles p where p.id = v_uid;

  select
    count(*) filter (where s.created_at > now() - interval '7 days'),
    count(*) filter (where s.created_at > now() - interval '1 day')
  into v_recent, v_today
  from public.spots s
  where s.author_id = v_uid;

  if v_today >= 20 then
    raise exception using message = 'Ang dami mo nang na pin ngayon. Pahinga muna, bukas ulit.', hint = 'rate_limited';
  end if;

  if v_account_age < interval '30 days' and v_recent >= 3 then
    raise exception using
      message = 'Hanggang 3 spot muna kada linggo para sa bagong account. Subukan ulit sa susunod na linggo.',
      hint = 'rate_limited';
  end if;

  v_point := extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography;

  if p_device_lat is not null and p_device_lng is not null then
    v_device := extensions.st_setsrid(extensions.st_makepoint(p_device_lng, p_device_lat), 4326)::extensions.geography;
  end if;

  -- The public circle is 1 km wide (500 m radius). Its center sits 100 to 400 m from
  -- the real point in a random direction, chosen once and never re-randomized, so
  -- averaging many reads cannot reveal the point and the point stays inside the circle.
  v_center := extensions.st_project(
    v_point,
    100 + random() * 300,
    random() * 2 * pi()
  );

  insert into public.spots (
    author_id, name, notes, visibility, area_center, area_radius_m,
    methods, species, pinned_on_site
  )
  values (
    v_uid,
    btrim(p_name),
    nullif(btrim(p_notes), ''),
    coalesce(p_visibility, 'public'),
    v_center,
    500,
    coalesce(p_methods, '{}'),
    coalesce(p_species, '{}'),
    v_device is not null and extensions.st_dwithin(v_device, v_point, 300)
  )
  returning id into v_spot_id;

  insert into public.spot_locations (spot_id, point) values (v_spot_id, v_point);

  return v_spot_id;
end;
$$;

revoke execute on function public.pin_spot from anon, public;
grant execute on function public.pin_spot to authenticated;
