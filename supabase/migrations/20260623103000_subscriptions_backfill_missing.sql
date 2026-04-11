-- Backfill `public.subscriptions` for businesses that have no row yet.
-- The billing upgrade API and Paystack webhook update by `business_id`; without a row,
-- checkout returned: "No subscription row found for this business."
--
-- Prerequisites: NOT NULL `provider` and `provider_sub_id` on `public.subscriptions`.
-- Placeholder sub id is stable per business until a real PSP subscription id exists.
--
-- Idempotent: only inserts when no subscription row exists for that business.

insert into public.subscriptions (
  id,
  business_id,
  plan_code,
  status,
  updated_at,
  provider,
  provider_sub_id
)
select
  gen_random_uuid(),
  b.id,
  case
    when lower(trim(coalesce(b.plan, ''))) in ('grow', 'premium', 'elite')
      then lower(trim(b.plan))
    else 'free'
  end,
  'active',
  now(),
  'tellacity',
  'tellacity:' || b.id::text
from public.businesses b
where not exists (
  select 1
  from public.subscriptions s
  where s.business_id = b.id
);
