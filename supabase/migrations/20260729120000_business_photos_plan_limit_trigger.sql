-- =========================================================================
-- business_photos: enforce per-plan photo caps at the database level.
--
-- Until now the cap ({free:4, grow:25, premium:100, elite:200}) was only
-- enforced by the upload API. This migration moves the cap into the
-- database so a direct INSERT (SQL editor, migration, webhook, etc.)
-- can't accidentally over-fill a business past its subscription limit.
--
--   1. `public.plan_photo_limits`
--        Lookup table keyed by normalized plan key. Seeded with the
--        current caps so future cap changes are a one-row UPDATE rather
--        than a migration.
--
--   2. `public.business_photos_enforce_plan_limit()`
--        Plpgsql trigger function. Normalizes the business's most recent
--        active|trialing subscription's `plan_code` to a plan key,
--        counts existing rows, and raises SQLSTATE P0001 when the insert
--        would push the total over the cap.
--
--   3. `business_photos_plan_limit_trg`
--        BEFORE INSERT ON public.business_photos FOR EACH ROW.
--
-- Grandfathering: a business that already has MORE rows than the new cap
-- (e.g. a legacy account with 5 photos on Free) keeps its rows — the
-- trigger only blocks the row that would strictly exceed the cap. The
-- caller sees HTTP 403 with the same `"You've reached your plan's photo
-- limit (<N> photos)."` message the API already uses, so the existing
-- `PhotoLimitModal` and toast flows keep working unchanged.
--
-- Safe to re-run.
-- =========================================================================

-- 1. Plan cap lookup table ----------------------------------------------

create table if not exists public.plan_photo_limits (
  plan_key text primary key
    check (plan_key in ('free', 'grow', 'premium', 'elite')),
  photo_limit integer not null
    check (photo_limit >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.plan_photo_limits is
  'Per-plan maximum number of business_photos rows per business_id. Read by the business_photos_plan_limit_trg trigger. To change a cap: UPDATE public.plan_photo_limits SET photo_limit = <new> WHERE plan_key = ''<key>''.';

insert into public.plan_photo_limits (plan_key, photo_limit) values
  ('free',    4),
  ('grow',   25),
  ('premium', 100),
  ('elite',   200)
on conflict (plan_key) do update
  set photo_limit = excluded.photo_limit,
      updated_at  = now();

-- RLS: caps are not secret but they're app configuration, so only let
-- anon/authenticated read. Writes go through the service role.
alter table public.plan_photo_limits enable row level security;

drop policy if exists "plan_photo_limits_public_select" on public.plan_photo_limits;
create policy "plan_photo_limits_public_select"
  on public.plan_photo_limits for select
  to anon, authenticated
  using (true);

grant select on public.plan_photo_limits to anon, authenticated;

-- 2. Trigger function ----------------------------------------------------

create or replace function public.business_photos_enforce_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw_plan_code text;
  v_plan_key      text;
  v_cap           integer;
  v_existing      integer;
begin
  -- Resolve the business's active plan by mirroring the app-side rule in
  -- src/lib/plans.ts → pickPlanResolutionSubscriptionRow:
  --   - subscription.status must be 'active' or 'trialing'
  --   - prefer 'active' over 'trialing'
  --   - within a status, prefer rows with a current_period_end set
  --   - within that, newest updated_at wins
  -- Absent any active/trialing row → treat as Free.
  select s.plan_code
    into v_raw_plan_code
  from public.subscriptions s
  where s.business_id = new.business_id
    and s.status in ('active', 'trialing')
  order by
    case lower(s.status) when 'active' then 0 when 'trialing' then 1 else 2 end,
    case when s.current_period_end is not null then 0 else 1 end,
    coalesce(s.updated_at, '-infinity'::timestamptz) desc
  limit 1;

  -- Normalize `plan_code` (e.g. `business_grow_monthly`) → plan_key
  -- (`grow`). Keep this in lockstep with normalizePlanCodeToKey() in
  -- src/lib/plans.ts.
  v_plan_key := lower(coalesce(v_raw_plan_code, ''));
  if v_plan_key like 'business\_%' escape '\' then
    v_plan_key := substr(v_plan_key, length('business_') + 1);
  end if;
  if position('_' in v_plan_key) > 0 then
    v_plan_key := split_part(v_plan_key, '_', 1);
  end if;
  if v_plan_key not in ('free', 'grow', 'premium', 'elite') then
    v_plan_key := 'free';
  end if;

  -- Cap lookup (falls back to Free if the row was deleted).
  select ppl.photo_limit
    into v_cap
  from public.plan_photo_limits ppl
  where ppl.plan_key = v_plan_key;

  if v_cap is null then
    select ppl.photo_limit into v_cap
    from public.plan_photo_limits ppl
    where ppl.plan_key = 'free';
  end if;

  if v_cap is null then
    -- Table empty / missing → fail open so a misconfiguration doesn't
    -- block every upload. The app-side check still enforces the cap.
    return new;
  end if;

  -- Count existing rows. Match the application logic exactly: every row
  -- (draft + published, every moderation_status, every section) counts
  -- against the business's total cap.
  select count(*)::int
    into v_existing
  from public.business_photos bp
  where bp.business_id = new.business_id;

  if v_existing >= v_cap then
    raise exception
      using
        errcode = 'P0001',
        -- Same prefix the upload API uses; isPhotoLimitResponse() in
        -- src/lib/photoUploadFreeLimit.ts already matches on it so the
        -- existing PhotoLimitModal fires for DB-level rejections too.
        message = format(
          'You''ve reached your plan''s photo limit (%s photos).',
          v_cap
        );
  end if;

  return new;
end;
$$;

comment on function public.business_photos_enforce_plan_limit() is
  'BEFORE INSERT trigger on business_photos. Resolves the business''s active subscription plan, looks up the cap in plan_photo_limits, and blocks inserts that would exceed it. Mirrors src/lib/plans.ts plan resolution + src/lib/photoUploadFreeLimit.ts error prefix.';

-- 3. Wire the trigger ----------------------------------------------------

drop trigger if exists business_photos_plan_limit_trg
  on public.business_photos;

create trigger business_photos_plan_limit_trg
  before insert on public.business_photos
  for each row
  execute function public.business_photos_enforce_plan_limit();

-- 4. Grants (service role already has EXECUTE; make it explicit for
--    authenticated so direct inserts from supabase-js hit the trigger
--    with the caller's privileges). --------------------------------------

grant execute on function public.business_photos_enforce_plan_limit()
  to anon, authenticated, service_role;
