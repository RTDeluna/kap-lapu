-- Catches, likes, comments and the read functions the map uses.
--
-- A catch is visible when its spot is visible. A catch with no spot carries no
-- location, so it is public. If a spot is deleted its catches keep their data but
-- lose the spot link, which leaks nothing about where they were caught.

create table public.catches (
  id uuid primary key default gen_random_uuid(),
  angler_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete set null,
  species text not null check (char_length(btrim(species)) between 1 and 60),
  weight_kg numeric(5, 2) check (weight_kg > 0 and weight_kg < 500),
  length_cm numeric(5, 1) check (length_cm > 0 and length_cm < 1000),
  method text check (char_length(method) <= 40),
  caught_at timestamptz not null default now() check (caught_at <= now() + interval '1 hour'),
  photo_path text check (char_length(photo_path) <= 300),
  -- Set only by the photo pipeline after it confirms an in-app camera capture.
  fresh_capture boolean not null default false,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);

create index catches_spot_idx on public.catches (spot_id, caught_at desc);
create index catches_angler_idx on public.catches (angler_id, caught_at desc);
alter table public.catches enable row level security;

create function private.can_see_catch(p_catch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.catches c
    where c.id = p_catch_id
      and (
        c.angler_id = (select auth.uid())
        or (
          c.hidden_at is null
          and not private.blocked_with(c.angler_id)
          and (c.spot_id is null or private.can_see_spot(c.spot_id))
        )
      )
  );
$$;

create policy "catches follow their spot"
  on public.catches for select
  to anon, authenticated
  using (
    angler_id = (select auth.uid())
    or (
      hidden_at is null
      and not private.blocked_with(angler_id)
      and (spot_id is null or private.can_see_spot(spot_id))
    )
    or private.is_admin()
  );

create policy "anglers log catches at spots they can see"
  on public.catches for insert
  to authenticated
  with check (
    angler_id = (select auth.uid())
    and (spot_id is null or private.can_see_spot(spot_id))
  );

create policy "anglers delete their catches"
  on public.catches for delete
  to authenticated
  using (angler_id = (select auth.uid()));

revoke all on table public.catches from anon, authenticated;
grant select on table public.catches to anon, authenticated;
grant insert (spot_id, species, weight_kg, length_cm, method, caught_at) on table public.catches to authenticated;
grant delete on table public.catches to authenticated;

-- Likes ---------------------------------------------------------------------

create table public.catch_likes (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  catch_id uuid not null references public.catches (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, catch_id)
);

create index catch_likes_catch_idx on public.catch_likes (catch_id);
alter table public.catch_likes enable row level security;

create policy "likes follow their catch"
  on public.catch_likes for select
  to anon, authenticated
  using (private.can_see_catch(catch_id) and not private.blocked_with(user_id));

create policy "people like catches they can see"
  on public.catch_likes for insert
  to authenticated
  with check (user_id = (select auth.uid()) and private.can_see_catch(catch_id));

create policy "people remove their likes"
  on public.catch_likes for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.catch_likes from anon, authenticated;
grant select on table public.catch_likes to anon, authenticated;
grant insert (catch_id) on table public.catch_likes to authenticated;
grant delete on table public.catch_likes to authenticated;

-- Comments ------------------------------------------------------------------
-- Comments are hidden or removed on a valid report, never edited by Laot.

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  catch_id uuid not null references public.catches (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);

create index comments_catch_idx on public.comments (catch_id, created_at);
alter table public.comments enable row level security;

create policy "comments follow their catch"
  on public.comments for select
  to anon, authenticated
  using (
    private.can_see_catch(catch_id)
    and not private.blocked_with(author_id)
    and (hidden_at is null or author_id = (select auth.uid()) or private.is_admin())
  );

create policy "people comment on catches they can see"
  on public.comments for insert
  to authenticated
  with check (author_id = (select auth.uid()) and private.can_see_catch(catch_id));

create policy "authors and the catch's angler delete comments"
  on public.comments for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    or exists (
      select 1 from public.catches c
      where c.id = catch_id and c.angler_id = (select auth.uid())
    )
  );

revoke all on table public.comments from anon, authenticated;
grant select on table public.comments to anon, authenticated;
grant insert (catch_id, body) on table public.comments to authenticated;
grant delete on table public.comments to authenticated;

-- Map reads -----------------------------------------------------------------
-- Security invoker, so RLS decides every row: a spot the caller may not see is
-- simply absent, and an exact point they may not see comes back as the area center.

create function public.nearby_spots(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer default 20000,
  p_method text default null
)
returns table (
  id uuid,
  name text,
  author_id uuid,
  author_handle text,
  visibility public.spot_visibility,
  lat double precision,
  lng double precision,
  is_exact boolean,
  area_radius_m integer,
  pinned_on_site boolean,
  catch_count integer,
  has_fresh_catch boolean,
  methods text[],
  species text[],
  distance_m integer,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography as g
  ),
  rows as (
    select
      s.*,
      p.handle as author_handle,
      coalesce(l.point, s.area_center) as shown,
      l.point is not null as is_exact
    from public.spots s
    join public.profiles p on p.id = s.author_id
    left join public.spot_locations l on l.spot_id = s.id
    cross join q
    where extensions.st_dwithin(s.area_center, q.g, least(greatest(p_radius_m, 100), 50000))
      and (p_method is null or p_method = any (s.methods))
  )
  select
    r.id,
    r.name,
    r.author_id,
    r.author_handle,
    r.visibility,
    extensions.st_y(r.shown::extensions.geometry),
    extensions.st_x(r.shown::extensions.geometry),
    r.is_exact,
    r.area_radius_m,
    r.pinned_on_site,
    (select count(*)::integer from public.catches c where c.spot_id = r.id),
    exists (
      select 1 from public.catches c
      where c.spot_id = r.id and c.fresh_capture and c.caught_at > now() - interval '72 hours'
    ),
    r.methods,
    r.species,
    round(extensions.st_distance(r.shown, q.g))::integer,
    r.created_at
  from rows r
  cross join q
  order by extensions.st_distance(r.shown, q.g)
  limit 200;
$$;

create function public.get_spot(p_spot_id uuid)
returns table (
  id uuid,
  name text,
  notes text,
  author_id uuid,
  author_handle text,
  visibility public.spot_visibility,
  lat double precision,
  lng double precision,
  is_exact boolean,
  area_radius_m integer,
  pinned_on_site boolean,
  catch_count integer,
  has_fresh_catch boolean,
  methods text[],
  species text[],
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id,
    s.name,
    s.notes,
    s.author_id,
    p.handle,
    s.visibility,
    extensions.st_y(coalesce(l.point, s.area_center)::extensions.geometry),
    extensions.st_x(coalesce(l.point, s.area_center)::extensions.geometry),
    l.point is not null,
    s.area_radius_m,
    s.pinned_on_site,
    (select count(*)::integer from public.catches c where c.spot_id = s.id),
    exists (
      select 1 from public.catches c
      where c.spot_id = s.id and c.fresh_capture and c.caught_at > now() - interval '72 hours'
    ),
    s.methods,
    s.species,
    s.created_at
  from public.spots s
  join public.profiles p on p.id = s.author_id
  left join public.spot_locations l on l.spot_id = s.id
  where s.id = p_spot_id;
$$;

grant execute on function public.nearby_spots to anon, authenticated;
grant execute on function public.get_spot to anon, authenticated;
