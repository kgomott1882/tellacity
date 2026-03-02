-- Category listing: businesses by primary OR secondary category (active only, real counts).
-- Run this entire file in Supabase SQL Editor if migrations are not applied.
-- Requires: public.businesses (id, name, slug, website, website_display, category_slug, secondary_category_slugs, country_code, city, logo_url, status), public.reviews (business_id, rating).
--
-- After running, test the list RPC (replace 'construction-services' with your category slug):
--   SELECT * FROM get_top_businesses_for_category_global('construction-services', null, null, 20, 0);
-- If that returns rows but the app still shows "No businesses listed", the issue is client/API (e.g. wrong param names). If it returns 0 rows, the issue is data or filter logic.

-- 1) List businesses for a category (slug = primary category_slug OR in secondary_category_slugs; active only)
-- Drop all overloads so only one remains (avoids "Could not choose the best candidate" when both numeric and double precision exist).
drop function if exists public.get_top_businesses_for_category_global(text, text, float, int, int);
drop function if exists public.get_top_businesses_for_category_global(text, text, numeric, int, int);
drop function if exists public.get_top_businesses_for_category_global(text, text, double precision, int, int);

create or replace function public.get_top_businesses_for_category_global(
  p_category_slug text,
  p_country_code text default null,
  p_min_rating double precision default null,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  website text,
  trust_score float,
  average_rating float,
  avg_rating float,
  review_count bigint,
  category_slug text,
  country_code text,
  address text,
  city text,
  display_location text,
  resolved_logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  with rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt
    from public.reviews r
    where r.status = 'published'
    group by r.business_id
  ),
  cat_slug as (select nullif(trim(lower(p_category_slug)), '') as slug)
  select
    b.id,
    b.name,
    b.slug,
    coalesce(b.website_display, b.website, '')::text as website,
    coalesce(rev.avg_rating, 0)::float as trust_score,
    coalesce(rev.avg_rating, 0)::float as average_rating,
    coalesce(rev.avg_rating, 0)::float as avg_rating,
    coalesce(rev.cnt, 0)::bigint as review_count,
    b.category_slug,
    b.country_code,
    coalesce(b.address, '')::text as address,
    coalesce(b.city, '')::text as city,
    trim(concat_ws(', ', nullif(trim(coalesce(b.city, '')), ''), nullif(trim(coalesce(b.country_code, '')), '')))::text as display_location,
    b.logo_url::text as resolved_logo_url
  from public.businesses b
  cross join cat_slug cs
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (cs.slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = cs.slug)
    or (
      b.secondary_category_slugs is not null
      and cs.slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = cs.slug
      )
    )
  )
  and (p_country_code is null or b.country_code = p_country_code)
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating)
  order by coalesce(rev.avg_rating, 0) desc, coalesce(rev.cnt, 0) desc, b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Returns businesses for category page: primary category_slug or slug in secondary_category_slugs.';

-- 2) Count businesses for the same filter (primary or secondary; active only)
-- Returns integer so the JS client gets a plain number (avoids bigint serialization issues).
drop function if exists public.get_category_business_count(text, text, float);
drop function if exists public.get_category_business_count(text, text, numeric);
drop function if exists public.get_category_business_count(text, text, double precision);

create or replace function public.get_category_business_count(
  p_category_slug text,
  p_country_code text default null,
  p_min_rating double precision default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating
    from public.reviews r
    where r.status = 'published'
    group by r.business_id
  ),
  cat_slug as (select nullif(trim(lower(p_category_slug)), '') as slug)
  select (count(*)::bigint)::integer
  from public.businesses b
  cross join cat_slug cs
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (cs.slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = cs.slug)
    or (
      b.secondary_category_slugs is not null
      and cs.slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = cs.slug
      )
    )
  )
  and (p_country_code is null or b.country_code = p_country_code)
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating);
$$;

comment on function public.get_category_business_count(text, text, double precision) is
  'Count of businesses for category (primary or secondary match).';

-- 3) Allow anonymous and authenticated to call these (needed for public category pages)
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;
grant execute on function public.get_category_business_count(text, text, double precision) to anon;
grant execute on function public.get_category_business_count(text, text, double precision) to authenticated;
