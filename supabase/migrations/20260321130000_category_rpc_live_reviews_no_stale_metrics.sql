-- Category list/count RPCs: aggregate directly from public.reviews (published + null status).
-- Avoids stale data if business_review_metrics_v was ever a materialized view, table snapshot, or out of sync.
-- Deleted reviews disappear immediately; matches get_business_by_slug and the /b profile.

-- If this name was created as a materialized view in the past, drop it so nothing else reads stale rows.
drop materialized view if exists public.business_review_metrics_v;

create index if not exists reviews_public_by_business_idx
  on public.reviews (business_id)
  where (status is null or status = 'published');

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
  'Category listing: live aggregates from reviews (null or published only); no metrics snapshot.';

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;

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
  'Category business count with same filters as get_top_businesses_for_category_global; live review aggregates.';

grant execute on function public.get_category_business_count(text, text, double precision) to anon;
grant execute on function public.get_category_business_count(text, text, double precision) to authenticated;
