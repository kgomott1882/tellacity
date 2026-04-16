-- Landing page uses public.home_feed_v2 when present; it must exclude moderated hidden
-- reviews (same rules as business_review_metrics_v + reviews fallback).

drop view if exists public.home_feed_v2;

create view public.home_feed_v2 as
select
  r.id as review_id,
  r.rating,
  r.title,
  r.body,
  r.created_at,
  r.guest_name,
  r.guest_name as reviewer_name,
  coalesce(r.like_count, 0)::integer as like_count,
  b.country_code::text as country_code,
  b.name::text as business_name,
  b.slug::text as business_slug,
  coalesce(b.website, '')::text as website,
  coalesce(b.logo_url, null)::text as resolved_logo_url,
  coalesce(m.review_count, 0)::bigint as review_count,
  r.visibility_status::text as visibility_status
from public.reviews r
inner join public.businesses b on b.id = r.business_id
left join public.business_review_metrics_v m on m.business_id = b.id
where (r.status is null or r.status = 'published')
  and coalesce(r.visibility_status, 'visible') = 'visible'
  and coalesce(b.status, 'active') = 'active';

comment on view public.home_feed_v2 is
  'Public landing feed: active businesses, published reviews, visibility visible only.';

grant select on public.home_feed_v2 to anon, authenticated;
