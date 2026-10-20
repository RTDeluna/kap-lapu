-- Reports, the audit log and admin actions.
--
-- Three reports from three different people hide an item until an admin reviews it.
-- Laot hides or removes posts; it never edits them, because an editor is treated
-- as an author under the Cybercrime Act.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_kind public.report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id),
  unique (reporter_id, target_kind, target_id)
);

create index reports_target_idx on public.reports (target_kind, target_id) where status = 'open';
alter table public.reports enable row level security;

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_kind text not null,
  target_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_target_idx on public.audit_events (target_kind, target_id);
alter table public.audit_events enable row level security;

create policy "admins read the audit log"
  on public.audit_events for select
  to authenticated
  using (private.is_admin());

-- Nobody writes the audit log through the API. Only the functions below append to it.
revoke all on table public.audit_events from anon, authenticated;
grant select on table public.audit_events to authenticated;

create function private.audit(
  p_action text,
  p_target_kind text,
  p_target_id uuid,
  p_before jsonb,
  p_after jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_events (actor_id, action, target_kind, target_id, before, after)
  values ((select auth.uid()), p_action, p_target_kind, p_target_id, p_before, p_after);
$$;

revoke execute on function private.audit from anon, authenticated, public;

-- Reports -------------------------------------------------------------------

create policy "reporters and admins see reports"
  on public.reports for select
  to authenticated
  using (reporter_id = (select auth.uid()) or private.is_admin());

create policy "people report what they can see"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');

revoke all on table public.reports from anon, authenticated;
grant select on table public.reports to authenticated;
grant insert (target_kind, target_id, reason) on table public.reports to authenticated;

-- You can only report something you can see, so nobody can bury content they were
-- never shown. Runs as definer so it can read every target table.
create function private.check_report_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  v_ok := case new.target_kind
    when 'spot' then private.can_see_spot(new.target_id)
    when 'catch' then private.can_see_catch(new.target_id)
    when 'comment' then exists (
      select 1 from public.comments c
      where c.id = new.target_id and private.can_see_catch(c.catch_id)
    )
    when 'message' then exists (
      select 1 from public.messages m
      where m.id = new.target_id and private.is_conversation_member(m.conversation_id)
    )
    when 'boat' then exists (
      select 1 from public.boats b
      where b.id = new.target_id and b.badge in ('verified', 'licensed') and b.hidden_at is null
    )
    when 'profile' then exists (select 1 from public.profiles p where p.id = new.target_id)
  end;

  if not coalesce(v_ok, false) then
    raise exception using message = 'Hindi mahanap ang ire-report mo.', hint = 'not_found';
  end if;

  if new.target_kind = 'profile' and new.target_id = new.reporter_id then
    raise exception using message = 'Hindi mo pwedeng i-report ang sarili mo.', hint = 'invalid_target';
  end if;

  return new;
end;
$$;

create trigger reports_check_target
  before insert on public.reports
  for each row execute function private.check_report_target();

create function private.set_hidden(p_kind public.report_target, p_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz := case when p_hidden then now() end;
begin
  case p_kind
    when 'spot' then update public.spots set hidden_at = v_at where id = p_id;
    when 'catch' then update public.catches set hidden_at = v_at where id = p_id;
    when 'comment' then update public.comments set hidden_at = v_at where id = p_id;
    when 'message' then update public.messages set hidden_at = v_at where id = p_id;
    when 'boat' then update public.boats set hidden_at = v_at where id = p_id;
    else null; -- Profiles are never auto hidden; an admin decides.
  end case;
end;
$$;

revoke execute on function private.set_hidden from anon, authenticated, public;

create function private.hide_after_three_reports()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(distinct r.reporter_id)
    from public.reports r
    where r.target_kind = new.target_kind
      and r.target_id = new.target_id
      and r.status = 'open'
  ) >= 3 then
    perform private.set_hidden(new.target_kind, new.target_id, true);
  end if;
  return new;
end;
$$;

create trigger reports_hide_after_three
  after insert on public.reports
  for each row execute function private.hide_after_three_reports();

-- Admins can see a reported spot or message even when it is not public, so they can
-- review it. They still never receive a spot's exact point.
create or replace function private.can_see_spot(p_spot_id uuid)
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
        or (
          private.is_admin()
          and (
            s.visibility = 'public'
            or exists (
              select 1 from public.reports r
              where r.target_kind = 'spot' and r.target_id = s.id
            )
          )
        )
      )
  );
$$;

create policy "admins read reported messages"
  on public.messages for select
  to authenticated
  using (
    private.is_admin()
    and exists (
      select 1 from public.reports r
      where r.target_kind = 'message' and r.target_id = messages.id
    )
  );

-- Admin actions -------------------------------------------------------------

create function private.require_admin()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception using message = 'Admins only.', hint = 'forbidden', errcode = '42501';
  end if;
end;
$$;

create function public.admin_resolve_report(p_report_id uuid, p_uphold boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_report public.reports%rowtype;
begin
  perform private.require_admin();

  select * into v_report from public.reports where id = p_report_id for update;
  if not found then
    raise exception using message = 'Report not found.', hint = 'not_found';
  end if;

  -- One decision covers every open report on the same target.
  update public.reports
  set status = case when p_uphold then 'upheld' else 'dismissed' end::public.report_status,
      resolved_at = now(),
      resolved_by = (select auth.uid())
  where target_kind = v_report.target_kind
    and target_id = v_report.target_id
    and status = 'open';

  perform private.set_hidden(v_report.target_kind, v_report.target_id, p_uphold);

  perform private.audit(
    case when p_uphold then 'report.upheld' else 'report.dismissed' end,
    v_report.target_kind::text,
    v_report.target_id,
    to_jsonb(v_report),
    jsonb_build_object('uphold', p_uphold)
  );
end;
$$;

create function public.admin_record_dock_check(
  p_person_id uuid,
  p_id_kind public.id_check_kind,
  p_passed boolean,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  perform private.require_admin();

  insert into public.dock_checks (person_id, id_kind, passed, checked_by, note)
  values (p_person_id, p_id_kind, p_passed, (select auth.uid()), p_note)
  returning id into v_id;

  if p_passed then
    update public.profiles set is_owner = true where id = p_person_id;
  end if;

  perform private.audit(
    'dock_check.recorded', 'profile', p_person_id, null,
    jsonb_build_object('dock_check_id', v_id, 'id_kind', p_id_kind, 'passed', p_passed)
  );
  return v_id;
end;
$$;

-- The four papers MARINA MC DS 2025-03 asks of a motorbanca carrying paying anglers.
create function private.has_current_papers(p_boat_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct p.kind) = 4
  from public.boat_papers p
  where p.boat_id = p_boat_id
    and p.kind in ('marina_registration', 'safety_certificate', 'passenger_insurance', 'cpc')
    and p.expires_on >= current_date;
$$;

create function public.admin_set_boat_badge(p_boat_id uuid, p_badge public.boat_badge)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_boat public.boats%rowtype;
begin
  perform private.require_admin();

  select * into v_boat from public.boats where id = p_boat_id for update;
  if not found then
    raise exception using message = 'Boat not found.', hint = 'not_found';
  end if;

  if p_badge in ('verified', 'licensed') and not exists (
    select 1 from public.dock_checks d
    where d.person_id = v_boat.owner_id and d.passed
  ) then
    raise exception using
      message = 'The owner needs a passed dock ID check first.',
      hint = 'dock_check_missing';
  end if;

  if p_badge = 'licensed' and not private.has_current_papers(p_boat_id) then
    raise exception using
      message = 'Licensed needs a current MARINA registration, safety certificate, passenger insurance and CPC.',
      hint = 'papers_missing';
  end if;

  -- Granting Licensed is the recheck, so it also clears a pending rate review.
  update public.boats
  set badge = p_badge,
      rates_need_review = case when p_badge = 'licensed' then false else rates_need_review end
  where id = p_boat_id;

  perform private.audit(
    'boat.badge_set', 'boat', p_boat_id,
    jsonb_build_object('badge', v_boat.badge, 'rates_need_review', v_boat.rates_need_review),
    jsonb_build_object('badge', p_badge)
  );
end;
$$;

-- Nightly: a Licensed boat whose papers lapse drops to verified until rechecked.
create function private.expire_lapsed_licenses()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_boat record;
  v_count integer := 0;
begin
  for v_boat in
    select b.id from public.boats b
    where b.badge = 'licensed' and not private.has_current_papers(b.id)
    for update
  loop
    update public.boats set badge = 'verified' where id = v_boat.id;
    insert into public.audit_events (actor_id, action, target_kind, target_id, before, after)
    values (null, 'boat.license_lapsed', 'boat', v_boat.id,
            jsonb_build_object('badge', 'licensed'), jsonb_build_object('badge', 'verified'));
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function private.expire_lapsed_licenses from anon, authenticated, public;

revoke execute on function public.admin_resolve_report from anon, public;
revoke execute on function public.admin_record_dock_check from anon, public;
revoke execute on function public.admin_set_boat_badge from anon, public;
grant execute on function public.admin_resolve_report to authenticated;
grant execute on function public.admin_record_dock_check to authenticated;
grant execute on function public.admin_set_boat_badge to authenticated;

-- Schedule the nightly check where pg_cron is available (Supabase has it).
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'expire-lapsed-licenses',
      '5 16 * * *', -- 00:05 Manila time
      'select private.expire_lapsed_licenses()'
    );
  end if;
end;
$$;
