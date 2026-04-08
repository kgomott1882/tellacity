-- Batched aggregates for homepage "Best in" (same filters as business_review_metrics_v).
-- Used by API with a uuid[] payload — avoids long GET URLs and view quirks.

create or replace function public.get_public_review_aggregates(p_business_ids uuid[])
returns table (
  business_id uuid,
  review_count bigint,
  average_rating double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.business_id,
    count(*)::bigint as review_count,
    avg(r.rating)::double precision as average_rating
  from public.reviews r
  where r.business_id = any(p_business_ids)
    and (r.status is null or r.status = 'published')
    and coalesce(r.visibility, 'visible') = 'visible'
  group by r.business_id;
$$;

comment on function public.get_public_review_aggregates(uuid[]) is
  'Published + visible review counts and averages for many businesses (homepage Best-in).';

grant execute on function public.get_public_review_aggregates(uuid[]) to service_role;
