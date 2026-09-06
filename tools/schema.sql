-- ═══════════════════════════════════════════════════════════════════════
--  PLAYER'S CLUB™ — portal schema.   Run once in the Supabase SQL editor.
--
--  Principles, in order:
--    1. The audit log cannot be edited or deleted by anyone, ever.
--    2. Clients never write money or units directly; they call functions
--       that check the caller's role server-side.
--    3. A model sees only her own rows. The house sees everything.
--       A partner sees everything but cannot close a quarter.
--    4. Every table has RLS on. No policy = no access.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ── roles ──────────────────────────────────────────────────────────────
do $$ begin
  create type member_role as enum ('founder','partner','model');
exception when duplicate_object then null; end $$;

do $$ begin
  create type asset_kind as enum ('photo','video');
exception when duplicate_object then null; end $$;

do $$ begin
  create type placement_role as enum ('cover','feature','cast','bts');
exception when duplicate_object then null; end $$;

do $$ begin
  create type quarter_status as enum ('open','closed','paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('new','shortlisted','approved','declined');
exception when duplicate_object then null; end $$;

-- ── people ─────────────────────────────────────────────────────────────
-- Keyed by email so the house can set someone up before she has logged in.
-- When she accepts her invite, the JWT email claim matches this row.
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null check (email = lower(email)),
  role        member_role not null default 'model',
  name        text not null,
  handle      text,
  since       date,
  -- model-editable
  tagline     text, city text, height text, size text, shoe text,
  socials     text, available text,
  portrait    text,                      -- path of the frame she chose
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── the work ───────────────────────────────────────────────────────────
create table if not exists projects (
  id            text primary key,        -- 'swim-001'
  issue_no      int  not null,
  title         text not null,
  subtitle      text,
  status        text not null default 'published',
  shot_on       date,
  published_on  date,
  created_at    timestamptz not null default now()
);

create table if not exists assets (
  id          uuid primary key default gen_random_uuid(),
  project_id  text not null references projects(id),
  kind        asset_kind not null default 'photo',
  path        text unique not null,      -- public path on the site
  set_name    text not null,             -- 'Karma — Uncut'
  seq         int,                       -- order within the set
  -- camera metadata, kept exactly as the original carried it
  frame       text,                      -- 'IMG_3239'
  taken_at    timestamptz,
  camera      text, lens text,
  iso         int, aperture text, shutter text, focal text,
  approved    boolean not null default true,   -- counts as a unit
  created_at  timestamptz not null default now()
);

create table if not exists asset_credits (       -- who is in the frame
  asset_id    uuid references assets(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete cascade,
  primary key (asset_id, profile_id)
);

create table if not exists placements (          -- role per project, and its bonus
  project_id   text references projects(id) on delete cascade,
  profile_id   uuid references profiles(id) on delete cascade,
  role         placement_role not null,
  bonus_units  int not null default 0,
  billing      text,                     -- 'Cover — SWIM 001'
  primary key (project_id, profile_id)
);

-- ── money ──────────────────────────────────────────────────────────────
create table if not exists quarters (
  id           text primary key,         -- '2026-Q3'
  label        text not null,
  window_start date not null,
  window_end   date not null,
  paid_on      text,
  status       quarter_status not null default 'open',
  revenue      numeric(12,2),
  closed_by    uuid references profiles(id),
  closed_at    timestamptz
);

-- a closed quarter's numbers, frozen
create table if not exists payouts (
  quarter_id   text references quarters(id),
  profile_id   uuid references profiles(id),
  units        int not null,
  share        numeric(6,2) not null,    -- percent of pool
  amount       numeric(12,2) not null,   -- earned this quarter
  carried_in   numeric(12,2) not null default 0,
  payable      numeric(12,2) not null,   -- amount + carried, if >= threshold
  paid         boolean not null default false,
  paid_at      timestamptz,
  primary key (quarter_id, profile_id)
);

-- ── casting ────────────────────────────────────────────────────────────
create table if not exists applications (
  id           uuid primary key default gen_random_uuid(),
  call_id      text not null,            -- 'no-boys-allowed'
  name         text not null,
  email        text not null,
  phone        text,
  city         text,
  instagram    text,
  height       text, sizes text,
  experience   text,
  note         text,
  photos_url   text,
  status       application_status not null default 'new',
  reviewed_by  uuid references profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

-- ── the audit log ──────────────────────────────────────────────────────
create table if not exists audit_log (
  id          bigserial primary key,
  at          timestamptz not null default now(),
  actor       uuid references profiles(id),
  actor_email text,
  action      text not null,
  target      text,
  detail      jsonb
);

-- append-only: no UPDATE or DELETE survives, for anyone
create or replace function audit_is_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append-only';
end $$;

drop trigger if exists audit_log_no_update on audit_log;
create trigger audit_log_no_update
  before update or delete on audit_log
  for each row execute function audit_is_immutable();

-- ── who is asking ──────────────────────────────────────────────────────
create or replace function me() returns profiles
language sql stable security definer set search_path = public as $$
  select * from profiles
  where email = lower(coalesce(auth.jwt()->>'email',''))
    and active
  limit 1
$$;

create or replace function my_role() returns member_role
language sql stable security definer set search_path = public as $$
  select role from profiles
  where email = lower(coalesce(auth.jwt()->>'email','')) and active limit 1
$$;

create or replace function is_house() returns boolean
language sql stable as $$ select my_role() in ('founder','partner') $$;

create or replace function is_founder() returns boolean
language sql stable as $$ select my_role() = 'founder' $$;

-- the only way anything gets written to the log
create or replace function log_action(p_action text, p_target text default null, p_detail jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare m profiles;
begin
  m := me();
  insert into audit_log (actor, actor_email, action, target, detail)
  values (m.id, coalesce(m.email, auth.jwt()->>'email'), p_action, p_target, p_detail);
end $$;

-- ── units, computed ────────────────────────────────────────────────────
create or replace view model_units as
select
  p.id                                                    as profile_id,
  x.project_id,
  x.frames,
  coalesce(pl.bonus_units, 0)                             as bonus,
  x.frames + coalesce(pl.bonus_units, 0)                  as units,
  pl.role                                                 as placement,
  pl.billing
from profiles p
join (
  select ac.profile_id, a.project_id, count(*) filter (where a.approved)::int as frames
  from asset_credits ac join assets a on a.id = ac.asset_id
  group by ac.profile_id, a.project_id
) x on x.profile_id = p.id
left join placements pl on pl.profile_id = p.id and pl.project_id = x.project_id;

-- ── closing a quarter: founder only, and only once ─────────────────────
create or replace function close_quarter(p_quarter text, p_revenue numeric)
returns setof payouts
language plpgsql security definer set search_path = public as $$
declare
  q quarters; pool numeric; total int; unit_value numeric; m profiles;
begin
  if not is_founder() then raise exception 'only the founder can close a quarter'; end if;
  select * into q from quarters where id = p_quarter for update;
  if q.id is null then raise exception 'no such quarter'; end if;
  if q.status <> 'open' then raise exception 'quarter % is already %', q.id, q.status; end if;
  if p_revenue is null or p_revenue < 0 then raise exception 'revenue must be a number'; end if;

  select coalesce(sum(units),0) into total from model_units;
  if total = 0 then raise exception 'no approved units to split'; end if;

  pool := round(p_revenue * 0.40, 2);
  unit_value := pool / total;
  m := me();

  insert into payouts (quarter_id, profile_id, units, share, amount, carried_in, payable)
  select p_quarter, mu.profile_id, mu.units,
         round(mu.units::numeric / total * 100, 2),
         round(unit_value * mu.units, 2),
         coalesce((select sum(payable) from payouts pp
                   where pp.profile_id = mu.profile_id and pp.paid = false and pp.payable < 100), 0),
         0
  from (select profile_id, sum(units)::int as units from model_units group by profile_id) mu;

  update payouts set payable = case when amount + carried_in >= 100 then amount + carried_in else 0 end
  where quarter_id = p_quarter;

  update quarters set status = 'closed', revenue = p_revenue, closed_by = m.id, closed_at = now()
  where id = p_quarter;

  perform log_action('close_quarter', p_quarter,
    jsonb_build_object('revenue', p_revenue, 'pool', pool, 'units', total, 'per_unit', round(unit_value, 4)));

  return query select * from payouts where quarter_id = p_quarter;
end $$;

-- mark a payout paid: founder only
create or replace function mark_paid(p_quarter text, p_profile uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_founder() then raise exception 'only the founder can mark a payout paid'; end if;
  update payouts set paid = true, paid_at = now()
  where quarter_id = p_quarter and profile_id = p_profile and paid = false;
  perform log_action('mark_paid', p_quarter, jsonb_build_object('profile', p_profile));
end $$;

-- review an application: founder or partner
create or replace function review_application(p_id uuid, p_status application_status)
returns void language plpgsql security definer set search_path = public as $$
declare m profiles;
begin
  if not is_house() then raise exception 'house only'; end if;
  m := me();
  update applications set status = p_status, reviewed_by = m.id, reviewed_at = now() where id = p_id;
  perform log_action('review_application', p_id::text, jsonb_build_object('status', p_status));
end $$;

-- a model updates only her own, only these fields
create or replace function update_my_profile(p jsonb)
returns profiles language plpgsql security definer set search_path = public as $$
declare m profiles;
begin
  m := me();
  if m.id is null then raise exception 'not signed in'; end if;
  update profiles set
    tagline   = coalesce(p->>'tagline',   tagline),
    city      = coalesce(p->>'city',      city),
    height    = coalesce(p->>'height',    height),
    size      = coalesce(p->>'size',      size),
    shoe      = coalesce(p->>'shoe',      shoe),
    socials   = coalesce(p->>'socials',   socials),
    available = coalesce(p->>'available', available),
    portrait  = coalesce(p->>'portrait',  portrait),
    updated_at = now()
  where id = m.id returning * into m;
  perform log_action('update_profile', m.id::text, p);
  return m;
end $$;

-- ── row level security ─────────────────────────────────────────────────
alter table profiles      enable row level security;
alter table projects      enable row level security;
alter table assets        enable row level security;
alter table asset_credits enable row level security;
alter table placements    enable row level security;
alter table quarters      enable row level security;
alter table payouts       enable row level security;
alter table applications  enable row level security;
alter table audit_log     enable row level security;

-- profiles: me, or everyone if house
drop policy if exists profiles_read on profiles;
create policy profiles_read on profiles for select to authenticated
  using (is_house() or email = lower(coalesce(auth.jwt()->>'email','')));
-- the cast: models can see each other's public face (name/handle/portrait) via a view below
drop policy if exists profiles_house_write on profiles;
create policy profiles_house_write on profiles for all to authenticated
  using (is_founder()) with check (is_founder());

-- projects: anyone signed in
drop policy if exists projects_read on projects;
create policy projects_read on projects for select to authenticated using (true);
drop policy if exists projects_write on projects;
create policy projects_write on projects for all to authenticated using (is_founder()) with check (is_founder());

-- assets: house sees all; a model sees frames she is credited in
drop policy if exists assets_read on assets;
create policy assets_read on assets for select to authenticated
  using (is_house() or exists (
    select 1 from asset_credits ac join profiles p on p.id = ac.profile_id
    where ac.asset_id = assets.id and p.email = lower(coalesce(auth.jwt()->>'email',''))));
drop policy if exists assets_write on assets;
create policy assets_write on assets for all to authenticated using (is_founder()) with check (is_founder());

drop policy if exists credits_read on asset_credits;
create policy credits_read on asset_credits for select to authenticated
  using (is_house() or exists (select 1 from profiles p where p.id = asset_credits.profile_id
         and p.email = lower(coalesce(auth.jwt()->>'email',''))));
drop policy if exists credits_write on asset_credits;
create policy credits_write on asset_credits for all to authenticated using (is_founder()) with check (is_founder());

drop policy if exists placements_read on placements;
create policy placements_read on placements for select to authenticated
  using (is_house() or exists (select 1 from profiles p where p.id = placements.profile_id
         and p.email = lower(coalesce(auth.jwt()->>'email',''))));
drop policy if exists placements_write on placements;
create policy placements_write on placements for all to authenticated using (is_founder()) with check (is_founder());

-- quarters: everyone signed in can read; writes only through close_quarter()
drop policy if exists quarters_read on quarters;
create policy quarters_read on quarters for select to authenticated using (true);

-- payouts: mine, or all if house; writes only through functions
drop policy if exists payouts_read on payouts;
create policy payouts_read on payouts for select to authenticated
  using (is_house() or exists (select 1 from profiles p where p.id = payouts.profile_id
         and p.email = lower(coalesce(auth.jwt()->>'email',''))));

-- applications: the public may apply; the house may read; changes only via review_application()
drop policy if exists applications_apply on applications;
create policy applications_apply on applications for insert to anon, authenticated with check (true);
drop policy if exists applications_read on applications;
create policy applications_read on applications for select to authenticated using (is_house());

-- audit: house reads; nobody writes directly (log_action is security definer)
drop policy if exists audit_read on audit_log;
create policy audit_read on audit_log for select to authenticated using (is_house());

-- the cast, as models are allowed to see each other
create or replace view cast_public as
select p.id, p.name, p.handle, p.portrait, p.since,
       (select jsonb_agg(jsonb_build_object('project', pl.project_id, 'role', pl.role, 'billing', pl.billing)
                order by pl.project_id desc)
          from placements pl where pl.profile_id = p.id) as placements
from profiles p where p.role = 'model' and p.active;
grant select on cast_public to authenticated;
grant select on model_units to authenticated;

-- what the api may touch
grant usage on schema public to anon, authenticated;
grant select on projects, quarters to authenticated;
grant select on profiles, assets, asset_credits, placements, payouts, audit_log to authenticated;
grant insert on applications to anon, authenticated;
grant select on applications to authenticated;
grant execute on function me(), my_role(), is_house(), is_founder(), log_action(text,text,jsonb),
  update_my_profile(jsonb), close_quarter(text,numeric), mark_paid(text,uuid),
  review_application(uuid,application_status) to authenticated;

-- touch updated_at
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_touch on profiles;
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();
