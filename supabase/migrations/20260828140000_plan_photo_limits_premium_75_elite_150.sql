-- Raise Premium / Elite photo caps to match src/lib/plans.ts (Premium 75, Elite 150).
-- Safe to re-run.

update public.plan_photo_limits
set photo_limit = 75,
    updated_at  = now()
where plan_key = 'premium';

update public.plan_photo_limits
set photo_limit = 150,
    updated_at  = now()
where plan_key = 'elite';

insert into public.plan_photo_limits (plan_key, photo_limit) values
  ('premium', 75),
  ('elite',   150)
on conflict (plan_key) do update
  set photo_limit = excluded.photo_limit,
      updated_at  = now();
