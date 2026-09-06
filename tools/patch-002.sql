-- ═══════════════════════════════════════════════════════════════════════
--  PLAYER'S CLUB™ — patch 002.  Run AFTER patch 001.  Safe to run twice.
--
--  1. Account types. One master account (owner) that sees and does
--     everything, then President, Vice President, Staff, and Models.
--  2. Invites. The House mints a one-time code; the person opens the
--     portal, enters it, sets a password, and is in. No email needed.
--  3. The quarters since the Club began (Aug 2025). The Vault was free, so
--     every one of them closed at $0 and models can pull a $0 statement.
-- ═══════════════════════════════════════════════════════════════════════

-- 1 ── roles ─────────────────────────────────────────────────────────────
drop view if exists cast_public;
alter table profiles alter column role type text using role::text;
update profiles set role = 'owner' where role = 'founder';
update profiles set role = 'vp'    where role = 'partner';
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('owner','president','vp','staff','model'));

-- the master account, and the two seats under it
update profiles set name = 'Stanley', handle = 'Founder'
  where email = 'stanleyfontaine83@gmail.com';
insert into profiles (email, role, name, handle, since, active)
  values ('tray.pending@playersclubhq.com', 'president', 'Tray D.', 'President', '2025-08-14', true)
  on conflict (email) do nothing;
update profiles set handle = 'Vice President' where email = 'lj.pending@playersclubhq.com';

drop function if exists my_role();
create function my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles
  where email = lower(coalesce(auth.jwt()->>'email','')) and active limit 1
$$;
create or replace function is_house()   returns boolean language sql stable as $$ select my_role() in ('owner','president','vp','staff') $$;
create or replace function is_founder() returns boolean language sql stable as $$ select my_role() in ('owner','president') $$;
create or replace function is_owner()   returns boolean language sql stable as $$ select my_role() = 'owner' $$;
create or replace function can_approve() returns boolean language sql stable as $$ select my_role() in ('owner','president','vp') $$;
grant execute on function my_role(), is_owner(), can_approve() to authenticated;

create view cast_public as
select p.id, p.name, p.handle, p.portrait, p.since, p.tagline, p.wants,
       (select jsonb_agg(jsonb_build_object('project', pl.project_id, 'role', pl.role, 'billing', pl.billing,
                                            'issue_no', pr.issue_no, 'title', pr.title)
                order by pr.issue_no desc)
          from placements pl join projects pr on pr.id = pl.project_id
          where pl.profile_id = p.id) as placements
from profiles p where p.role = 'model' and p.active;
grant select on cast_public to authenticated;

-- applications: owner, president, vice president
create or replace function review_application(p_id uuid, p_status application_status)
returns void language plpgsql security definer set search_path = public as $$
declare m profiles;
begin
  if not can_approve() then raise exception 'you cannot review applications'; end if;
  m := me();
  update applications set status = p_status, reviewed_by = m.id, reviewed_at = now() where id = p_id;
  perform log_action('review_application', p_id::text, jsonb_build_object('status', p_status));
end $$;

-- 2 ── invites ───────────────────────────────────────────────────────────
create table if not exists invites (
  id          uuid primary key default gen_random_uuid(),
  code_hash   text unique not null,
  profile_id  uuid not null references profiles(id) on delete cascade,
  email       text not null,
  name        text not null,
  role        text not null,
  created_by  uuid references profiles(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '30 days',
  used_at     timestamptz
);
alter table invites enable row level security;
drop policy if exists invites_read on invites;
create policy invites_read on invites for select to authenticated using (is_house());
grant select on invites to authenticated;

create or replace function mint_code() returns text language sql volatile as $$
  select 'PC-' || upper(substr(translate(encode(gen_random_bytes(9), 'base64'), '+/=0O1Il', 'ABCDEFGH'), 1, 5))
          || '-' || upper(substr(translate(encode(gen_random_bytes(9), 'base64'), '+/=0O1Il', 'JKMNPQRS'), 1, 5))
$$;

-- the House mints a code. Rules: the owner may invite anyone; the president
-- may invite a vice president, staff or a model; a vice president, models only.
create or replace function invite_create(p_email text, p_name text, p_role text, p_profile uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare m profiles; code text; pid uuid; r text := lower(trim(p_role)); e text := lower(trim(p_email)); cur text;
begin
  m := me();
  if m.id is null or m.role not in ('owner','president','vp') then raise exception 'you cannot invite'; end if;
  if r not in ('owner','president','vp','staff','model') then raise exception 'unknown role %', r; end if;
  if m.role = 'vp' and r <> 'model' then raise exception 'a vice president can only invite models'; end if;
  if m.role = 'president' and r in ('owner','president') then raise exception 'only the founder can invite a president'; end if;
  if e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'that is not an email address'; end if;

  if p_profile is not null then
    select role into cur from profiles where id = p_profile;
    if cur is null then raise exception 'no such person'; end if;
    if p_profile = m.id then raise exception 'you cannot invite yourself'; end if;
    if cur = 'owner' and m.role <> 'owner' then raise exception 'only the founder can touch the founder'; end if;
    update profiles set email = e, name = coalesce(nullif(trim(p_name), ''), name), role = r, active = false
      where id = p_profile returning id into pid;
  else
    select id into pid from profiles where email = e;
    if pid is null then
      insert into profiles (email, role, name, since, active) values (e, r, trim(p_name), current_date, false) returning id into pid;
    else
      if pid = m.id then raise exception 'you cannot invite yourself'; end if;
      update profiles set role = r, name = coalesce(nullif(trim(p_name), ''), name), active = false where id = pid;
    end if;
  end if;

  code := mint_code();
  delete from invites where profile_id = pid and used_at is null;
  insert into invites (code_hash, profile_id, email, name, role, created_by)
    values (encode(digest(code, 'sha256'), 'hex'), pid, e, coalesce(nullif(trim(p_name), ''), (select name from profiles where id = pid)), r, m.id);
  perform log_action('invite', pid::text, jsonb_build_object('email', e, 'role', r));
  return code;
end $$;

-- anyone with the code can see who it is for (name, email, role) — nothing else
create or replace function invite_peek(p_code text)
returns table (name text, email text, role text)
language sql stable security definer set search_path = public as $$
  select i.name, i.email, i.role from invites i
  where i.code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex')
    and i.used_at is null and i.expires_at > now()
$$;

-- signed in with the invited email + the code: the account switches on
create or replace function invite_claim(p_code text)
returns profiles language plpgsql security definer set search_path = public as $$
declare i invites; p profiles; e text := lower(coalesce(auth.jwt()->>'email',''));
begin
  select * into i from invites
    where code_hash = encode(digest(upper(trim(p_code)), 'sha256'), 'hex') and used_at is null and expires_at > now();
  if i.id is null then raise exception 'that invite is not valid any more'; end if;
  if i.email <> e then raise exception 'this invite is for %', i.email; end if;
  update profiles set active = true, email = e where id = i.profile_id returning * into p;
  update invites set used_at = now() where id = i.id;
  insert into audit_log (actor, actor_email, action, target, detail)
    values (p.id, e, 'invite_claimed', p.id::text, jsonb_build_object('role', p.role));
  return p;
end $$;

create or replace function invite_revoke(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not can_approve() then raise exception 'you cannot revoke invites'; end if;
  delete from invites where id = p_id and used_at is null;
  perform log_action('invite_revoked', p_id::text, null);
end $$;

-- the owner renames, re-roles or switches anyone off (never themself)
create or replace function set_member(p_profile uuid, p_name text, p_role text, p_active boolean)
returns profiles language plpgsql security definer set search_path = public as $$
declare m profiles; p profiles;
begin
  m := me();
  if m.role <> 'owner' then raise exception 'founder only'; end if;
  if p_profile = m.id then raise exception 'you cannot change your own account here'; end if;
  update profiles set
    name   = coalesce(nullif(trim(p_name), ''), name),
    role   = coalesce(nullif(lower(trim(p_role)), ''), role),
    active = coalesce(p_active, active)
  where id = p_profile returning * into p;
  if p.id is null then raise exception 'no such person'; end if;
  perform log_action('set_member', p.id::text, jsonb_build_object('name', p.name, 'role', p.role, 'active', p.active));
  return p;
end $$;

grant execute on function invite_peek(text) to anon, authenticated;
grant execute on function invite_create(text,text,text,uuid), invite_claim(text), invite_revoke(uuid),
  set_member(uuid,text,text,boolean) to authenticated;

-- 3 ── the quarters since Aug 2025: the Vault was free, every one closed at $0
insert into quarters (id, label, window_start, window_end, paid_on, status, revenue, closed_at) values
  ('2025-Q3', 'Q3 2025', '2025-07-01', '2025-09-30', 'October 2025', 'closed', 0, '2025-10-01'),
  ('2025-Q4', 'Q4 2025', '2025-10-01', '2025-12-31', 'January 2026', 'closed', 0, '2026-01-01'),
  ('2026-Q1', 'Q1 2026', '2026-01-01', '2026-03-31', 'April 2026',   'closed', 0, '2026-04-01'),
  ('2026-Q2', 'Q2 2026', '2026-04-01', '2026-06-30', 'July 2026',    'closed', 0, '2026-07-01')
on conflict (id) do nothing;

-- expect: Stanley owner · Tray D. president · LJ vp · five models; six quarters
select name, role, active, email from profiles order by (role <> 'owner'), role, name;
select id, status, revenue from quarters order by id;
