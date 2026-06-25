-- Optional one-time fix: businesses with default `tellacity:{id}` placeholder subs were
-- marked ineligible for trial because placeholder detection required literal plan_code
-- `free` and empty period_end. App code now treats `tellacity:%` as placeholder.
--
-- Run ONLY if trial CTAs still show "Upgrade to Grow" after deploy and the diagnostic
-- query below shows eligible=false due to subscription shape (not already_trialed).

-- Diagnostic: replace with your business id
-- select
--   b.id,
--   b.name,
--   s.plan_code,
--   s.status,
--   s.provider_sub_id,
--   s.current_period_end,
--   s.reverse_trial_used_at
-- from public.businesses b
-- left join public.subscriptions s on s.business_id = b.id
-- where b.id = 'YOUR_BUSINESS_ID';

-- Clear mistaken trial-used marker on never-trialed Tellacity placeholders only
update public.subscriptions
set reverse_trial_used_at = null
where reverse_trial_used_at is not null
  and provider_sub_id like 'tellacity:%'
  and status = 'active'
  and coalesce(lower(plan_code), 'free') in ('free', 'business_free');
