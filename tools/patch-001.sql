-- ═══════════════════════════════════════════════════════════════════════
--  PLAYER'S CLUB™ — patch 001.  Run AFTER schema.sql and seed.sql.
--  Safe to run twice.
--
--  1. Rollover was lost: a quarter under $100 wrote payable = 0, and the
--     next close summed payable (0) instead of amount. Now rolled rows are
--     marked rolled_into and their AMOUNT carries forward, once.
--  2. model_units ran as the view owner, so any signed-in model could read
--     everyone's units. It now runs as the caller (RLS applies).
--  3. vault_totals(): the whole-Vault unit count, safe to share, so a model
--     can see her share of the pool without seeing anyone else's rows.
--  4. "What you want to shoot next" gets a column; the cast view carries
--     each model's line and wants (the two things she writes for the cast).
--  5. Portraits and set order for the seeded roster.
--  6. club_keys: the crew key that opens the sealed casting briefs, for
--     anyone signed in. Nothing else goes in here.
-- ═══════════════════════════════════════════════════════════════════════

-- 1 ── rollover ──────────────────────────────────────────────────────────
alter table payouts add column if not exists rolled_into text references quarters(id);

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

  -- carried_in = everything she earned before that never cleared $100
  insert into payouts (quarter_id, profile_id, units, share, amount, carried_in, payable)
  select p_quarter, mu.profile_id, mu.units,
         round(mu.units::numeric / total * 100, 2),
         round(unit_value * mu.units, 2),
         coalesce((select sum(pp.amount) from payouts pp
                   where pp.profile_id = mu.profile_id and pp.paid = false
                     and pp.payable = 0 and pp.rolled_into is null
                     and pp.quarter_id <> p_quarter), 0),
         0
  from (select profile_id, sum(units)::int as units from model_units group by profile_id) mu;

  update payouts set payable = case when amount + carried_in >= 100 then amount + carried_in else 0 end
  where quarter_id = p_quarter;

  -- the rows that just cleared are folded into this quarter, never counted again
  update payouts pp set rolled_into = p_quarter
  where pp.paid = false and pp.payable = 0 and pp.rolled_into is null and pp.quarter_id <> p_quarter
    and exists (select 1 from payouts np where np.quarter_id = p_quarter
                and np.profile_id = pp.profile_id and np.payable > 0);

  update quarters set status = 'closed', revenue = p_revenue, closed_by = m.id, closed_at = now()
  where id = p_quarter;

  perform log_action('close_quarter', p_quarter,
    jsonb_build_object('revenue', p_revenue, 'pool', pool, 'units', total, 'per_unit', round(unit_value, 4)));

  return query select * from payouts where quarter_id = p_quarter;
end $$;

-- 2 ── model_units obeys RLS ─────────────────────────────────────────────
alter view model_units set (security_invoker = true);

-- 3 ── whole-Vault totals, no names ─────────────────────────────────────
create or replace function vault_totals()
returns table (project_id text, units int, frames int, models int)
language sql stable security definer set search_path = public as $$
  select a.project_id,
         -- one unit per credit, so a shared frame pays each model in it: same rule as model_units
         (count(*) filter (where a.approved))::int
           + coalesce((select sum(pl.bonus_units) from placements pl where pl.project_id = a.project_id), 0)::int as units,
         (count(distinct a.id) filter (where a.approved))::int as frames,
         (select count(distinct ac.profile_id) from asset_credits ac join assets x on x.id = ac.asset_id
           where x.project_id = a.project_id)::int as models
  from assets a
  join asset_credits ac on ac.asset_id = a.id
  group by a.project_id
$$;
grant execute on function vault_totals() to authenticated;

-- 4 ── wants + the cast view ────────────────────────────────────────────
alter table profiles add column if not exists wants text;

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
    wants     = coalesce(p->>'wants',     wants),
    portrait  = coalesce(p->>'portrait',  portrait),
    updated_at = now()
  where id = m.id returning * into m;
  perform log_action('update_profile', m.id::text, p);
  return m;
end $$;

drop view if exists cast_public;
create view cast_public as
select p.id, p.name, p.handle, p.portrait, p.since, p.tagline, p.wants,
       (select jsonb_agg(jsonb_build_object('project', pl.project_id, 'role', pl.role, 'billing', pl.billing,
                                            'issue_no', pr.issue_no, 'title', pr.title)
                order by pr.issue_no desc)
          from placements pl join projects pr on pr.id = pl.project_id
          where pl.profile_id = p.id) as placements
from profiles p where p.role = 'model' and p.active;
grant select on cast_public to authenticated;

-- 5 ── portraits for the seeded roster ──────────────────────────────────
update profiles set portrait = v.portrait from (values
  ('karma.pending@playersclubhq.com',  'assets/photos/swim-001/sets/karma/karma-02.jpg'),
  ('cherri.pending@playersclubhq.com', 'assets/photos/swim-001/sets/cherri/cherri-02.jpg'),
  ('kaykay.pending@playersclubhq.com', 'assets/photos/swim-001/sets/kaykay/kaykay-02.jpg'),
  ('naiomi.pending@playersclubhq.com', 'assets/photos/swim-001/sets/naiomi/naiomi-03.jpg'),
  ('ivorie.pending@playersclubhq.com', 'assets/photos/swim-001/sets/ivorie/ivorie-03.jpg')
) as v(email, portrait) where profiles.email = v.email and profiles.portrait is null;

-- 6 ── the crew key, for anyone signed in ───────────────────────────────
create table if not exists club_keys (k text primary key, v text not null);
alter table club_keys enable row level security;
drop policy if exists club_keys_read on club_keys;
create policy club_keys_read on club_keys for select to authenticated using (true);
grant select on club_keys to authenticated;
insert into club_keys (k, v) values ('crew', 'CREW-PC3H2TTBGT2NUJU974') on conflict (k) do update set v = excluded.v;

-- 7 ── units match the ledgers the cast has already seen ────────────────
-- The After Hours duo and the After Dark group frames are in the Vault and
-- in each girl's portfolio, but they never counted as units on anyone's
-- statement. `approved` means "counts as a unit". Flip these to true and
-- the group frames start paying each model in them (prospectively).
update assets set approved = false where path in (
  'assets/photos/swim-001/sets/afterhours/duo-01.jpg',
  'assets/photos/swim-001/sets/afterdark/ad-01.jpg',
  'assets/photos/swim-001/sets/afterdark/ad-group-night.jpg',
  'assets/photos/swim-001/sets/afterdark/ad-02.jpg');

-- expect Karma 15 · Cherri 6 · Kay Kay 4 · Naiomi 3 · Ivorie 3, and 31 in vault_totals
select p.name, mu.units from model_units mu join profiles p on p.id = mu.profile_id order by mu.units desc;
select * from vault_totals();
