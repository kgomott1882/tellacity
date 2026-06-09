-- Lower Premium / Elite photo caps to match src/lib/plans.ts (Premium 50, Elite 100).
-- Invite limits (Elite 3,000/mo) are enforced in application code only.
-- Safe to re-run.

update public.plan_photo_limits
set photo_limit = 50,
    updated_at  = now()
where plan_key = 'premium';

update public.plan_photo_limits
set photo_limit = 100,
    updated_at  = now()
where plan_key = 'elite';

insert into public.plan_photo_limits (plan_key, photo_limit) values
  ('premium', 50),
  ('elite',   100)
on conflict (plan_key) do update
  set photo_limit = excluded.photo_limit,
      updated_at  = now();
