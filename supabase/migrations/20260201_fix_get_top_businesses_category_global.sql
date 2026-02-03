-- Fix 500 on get_top_businesses_for_category_global: handle NULL secondary_category_slugs and ensure function exists.
-- Run in Supabase SQL Editor if you get 500 on category pages.

-- Ensure column exists (no-op if already there)
alter table public.businesses
  add column if not exists secondary_category_slugs text[] default '{}';

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
    where (r.status is null or r.status = 'published')
    group by r.business_id
  ),
  cat_slug as (select nullif(trim(lower(coalesce(p_category_slug, ''))), '') as slug)
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
      coalesce(b.secondary_category_slugs, array[]::text[]) <> array[]::text[]
      and cs.slug is not null
      and exists (
        select 1 from unnest(coalesce(b.secondary_category_slugs, array[]::text[])) s(s)
        where lower(trim(s.s)) = cs.slug
      )
    )
  )
  and (p_country_code is null or b.country_code = p_country_code)
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating)
  order by coalesce(rev.avg_rating, 0) desc, coalesce(rev.cnt, 0) desc, b.name asc
  limit greatest(0, coalesce(p_limit, 20))
  offset greatest(0, coalesce(p_offset, 0));
$$;

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Returns businesses for category page: primary category_slug or slug in secondary_category_slugs.';

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;

-- Fix get_category_business_count (same 500: NULL secondary_category_slugs / reviews.status)
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
    where (r.status is null or r.status = 'published')
    group by r.business_id
  ),
  cat_slug as (select nullif(trim(lower(coalesce(p_category_slug, ''))), '') as slug)
  select (count(*)::bigint)::integer
  from public.businesses b
  cross join cat_slug cs
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (cs.slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = cs.slug)
    or (
      coalesce(b.secondary_category_slugs, array[]::text[]) <> array[]::text[]
      and cs.slug is not null
      and exists (
        select 1 from unnest(coalesce(b.secondary_category_slugs, array[]::text[])) s(s)
        where lower(trim(s.s)) = cs.slug
      )
    )
  )
  and (p_country_code is null or b.country_code = p_country_code)
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating);
$$;

comment on function public.get_category_business_count(text, text, double precision) is
  'Count of businesses for category (primary or secondary match).';

grant execute on function public.get_category_business_count(text, text, double precision) to anon;
grant execute on function public.get_category_business_count(text, text, double precision) to authenticated;
