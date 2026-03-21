-- Public review aggregates must match the business profile and reviews API:
-- only reviews with status IS NULL OR status = 'published' (same as .or("status.is.null,status.eq.published")).
-- Fixes: category / Explore Rankings showing ratings the /b page counts as 0; ranking drift from mixed statuses.

create or replace view public.business_review_metrics_v as
select
  r.business_id,
  count(*)::bigint as review_count,
  avg(r.rating)::float as average_rating
from public.reviews r
where (r.status is null or r.status = 'published')
group by r.business_id;

comment on view public.business_review_metrics_v is
  'Aggregates for public listings: reviews with null or published status only.';

-- Profile RPC: use identical filter as business_review_metrics_v and the reviews query.
drop function if exists public.get_business_by_slug(text);

create or replace function public.get_business_by_slug(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  website text,
  website_display text,
  resolved_logo_url text,
  address text,
  city text,
  country_code text,
  description text,
  category_slug text,
  primary_group_slug text,
  primary_group_name text,
  category_name text,
  status text,
  email text,
  phone text,
  trust_score float,
  average_rating float,
  review_count bigint,
  rating_1_count bigint,
  rating_2_count bigint,
  rating_3_count bigint,
  rating_4_count bigint,
  rating_5_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.name,
    b.slug,
    coalesce(b.website, '')::text as website,
    coalesce(b.website_display, b.website, '')::text as website_display,
    coalesce(b.logo_url, null)::text as resolved_logo_url,
    coalesce(b.address, '')::text as address,
    coalesce(b.city, '')::text as city,
    coalesce(b.country_code, '')::text as country_code,
    coalesce(b.description, '')::text as description,
    coalesce(b.category_slug, '')::text as category_slug,
    coalesce(b.primary_group_slug, cg.slug)::text as primary_group_slug,
    cg.name::text as primary_group_name,
    c.name::text as category_name,
    coalesce(b.status, 'active')::text as status,
    b.email,
    b.phone,
    coalesce(rev.avg_rating, 0)::float as trust_score,
    coalesce(rev.avg_rating, 0)::float as average_rating,
    coalesce(rev.cnt, 0)::bigint as review_count,
    coalesce(rev.r1, 0)::bigint as rating_1_count,
    coalesce(rev.r2, 0)::bigint as rating_2_count,
    coalesce(rev.r3, 0)::bigint as rating_3_count,
    coalesce(rev.r4, 0)::bigint as rating_4_count,
    coalesce(rev.r5, 0)::bigint as rating_5_count
  from public.businesses b
  left join public.categories c on c.slug = b.category_slug
  left join public.category_groups cg on cg.slug = coalesce(b.primary_group_slug, c.group, b.category_slug)
  left join lateral (
    select
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt,
      count(*) filter (where round(r.rating) = 1)::bigint as r1,
      count(*) filter (where round(r.rating) = 2)::bigint as r2,
      count(*) filter (where round(r.rating) = 3)::bigint as r3,
      count(*) filter (where round(r.rating) = 4)::bigint as r4,
      count(*) filter (where round(r.rating) = 5)::bigint as r5
    from public.reviews r
    where r.business_id = b.id
      and (r.status is null or r.status = 'published')
  ) rev on true
  where b.slug = p_slug
  limit 1;
$$;

comment on function public.get_business_by_slug(text) is
  'Business profile; review aggregates use null or published only (matches metrics view + client).';

grant execute on function public.get_business_by_slug(text) to anon;
grant execute on function public.get_business_by_slug(text) to authenticated;
