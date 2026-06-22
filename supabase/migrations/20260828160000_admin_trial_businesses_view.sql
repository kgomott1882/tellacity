-- Admin trial reporting view (optional; app reads subscriptions directly).
-- Safe to run in Supabase SQL editor for ad-hoc queries.

create or replace view public.admin_trial_businesses_v1 as
select
  s.business_id,
  b.name as business_name,
  b.slug as business_slug,
  s.plan_code,
  s.status as subscription_status,
  s.provider,
  s.provider_sub_id,
  s.current_period_end as trial_ends_at,
  s.updated_at as subscription_updated_at,
  (
    select min(sc.changed_at)
    from public.subscription_changes sc
    where sc.business_id = s.business_id
      and lower(coalesce(sc.old_plan, '')) = 'free'
      and lower(sc.new_plan) = 'grow'
  ) as trial_started_at,
  case
    when s.status = 'trialing' and s.provider_sub_id like 'trial:%' then 'active'
    when s.provider_sub_id like 'trial:%'
      and s.status = 'active'
      and lower(coalesce(s.plan_code, 'free')) = 'free' then 'expired'
    else null
  end as trial_outcome
from public.subscriptions s
join public.businesses b on b.id = s.business_id
where s.provider_sub_id like 'trial:%';

comment on view public.admin_trial_businesses_v1 is
  'Active/expired Grow reverse trials (provider_sub_id trial: marker). Converted trials lose the marker after Paystack payment.';
