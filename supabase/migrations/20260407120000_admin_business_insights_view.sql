-- Admin dashboard: aggregated business performance signals for admin_business_insights.

create or replace view public.admin_business_insights as
select
  b.id as business_id,
  coalesce(b.name, '')::text as name,
  coalesce(lower(trim(b.plan)), 'free')::text as plan,
  coalesce(b.country_code, '')::text as country_code,
  coalesce(inv.cnt, 0)::bigint as total_invites,
  coalesce(rev.cnt, 0)::bigint as total_reviews,
  inv.last_invite as last_invite,
  rev.last_review as last_review,
  case
    when inv.last_invite is null and rev.last_review is null then null
    else greatest(inv.last_invite, rev.last_review)
  end as last_activity
from public.businesses b
left join (
  select
    business_id,
    count(*)::bigint as cnt,
    max(created_at) as last_invite
  from public.review_invites
  group by business_id
) inv on inv.business_id = b.id
left join (
  select
    business_id,
    count(*)::bigint as cnt,
    max(created_at) as last_review
  from public.reviews
  where (status is null or status = 'published')
  group by business_id
) rev on rev.business_id = b.id;

comment on view public.admin_business_insights is
  'Admin: per-business invites, reviews, and last-activity timestamps for Business Insights.';

grant select on public.admin_business_insights to authenticated;
grant select on public.admin_business_insights to service_role;
