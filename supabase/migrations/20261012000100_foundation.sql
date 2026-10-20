-- Foundation: extensions, enums, profiles and the private helpers that RLS policies call.
-- House rules: RLS on every table, helpers live in the unexposed `private` schema,
-- every security definer function pins search_path to '' and qualifies every name.

create extension if not exists postgis with schema extensions;

create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

create type public.spot_visibility as enum ('private', 'followers', 'public');
create type public.follow_status as enum ('pending', 'accepted');
create type public.boat_badge as enum ('none', 'verified', 'licensed');
create type public.report_target as enum ('spot', 'catch', 'comment', 'profile', 'message', 'boat');
create type public.report_status as enum ('open', 'upheld', 'dismissed');
create type public.zone_kind as enum ('sanctuary', 'port', 'coast_guard', 'other');

-- Profiles ------------------------------------------------------------------
-- The phone number stays in auth.users and is never copied here.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9._]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_path text check (char_length(avatar_path) <= 300),
  bio text check (char_length(bio) <= 280),
  is_owner boolean not null default false,
  is_coordinator boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, 'angler' || substr(replace(new.id::text, '-', ''), 1, 10));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Blocks --------------------------------------------------------------------
-- Defined here because almost every read policy checks it.

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index blocks_blocked_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;

-- Helpers -------------------------------------------------------------------
-- They answer questions about the caller only, so nobody can probe other pairs.

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

create function private.blocked_with(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = (select auth.uid()) and b.blocked_id = p_other)
       or (b.blocker_id = p_other and b.blocked_id = (select auth.uid()))
  );
$$;

grant execute on all functions in schema private to anon, authenticated, service_role;

-- Policies and grants -------------------------------------------------------

create policy "profiles are public unless blocked"
  on public.profiles for select
  to anon, authenticated
  using (not private.blocked_with(id));

create policy "people edit their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- is_admin is left out of the select grant so nobody can list whose account to phish.
-- Clients must name their columns; `select *` on profiles is refused.
revoke all on table public.profiles from anon, authenticated;
grant select (id, handle, display_name, avatar_path, bio, is_owner, is_coordinator, created_at)
  on table public.profiles to anon, authenticated;
grant update (handle, display_name, avatar_path, bio) on table public.profiles to authenticated;

create policy "people see their own blocks"
  on public.blocks for select
  to authenticated
  using (blocker_id = (select auth.uid()));

create policy "people block for themselves"
  on public.blocks for insert
  to authenticated
  with check (blocker_id = (select auth.uid()));

create policy "people unblock for themselves"
  on public.blocks for delete
  to authenticated
  using (blocker_id = (select auth.uid()));

revoke all on table public.blocks from anon, authenticated;
grant select, delete on table public.blocks to authenticated;
grant insert (blocked_id) on table public.blocks to authenticated;
alter table public.blocks alter column blocker_id set default auth.uid();
