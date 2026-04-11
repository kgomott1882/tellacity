-- Homepage performance: replace slow full-table `rev` CTE in category RPCs with
-- `business_review_metrics_v` joins (same filters + GB/UK normalization as prod).
--
-- We do NOT recreate `business_review_metrics_v` here — prod column order/names vary
-- and CREATE OR REPLACE VIEW causes 42P16. Your existing view must expose at least:
--   business_id, review_count, trust_score (avg rating).
--
-- Adds: get_home_feed_for_country + supporting indexes.

-- ---------------------------------------------------------------------------
-- 1) Top businesses: join business_review_metrics_v (no full-table review scan)
-- ---------------------------------------------------------------------------
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
  trust_score double precision,
  average_rating double precision,
  avg_rating double precision,
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
  with params as (
    select
      nullif(trim(lower(p_category_slug)), '') as cat_slug,
      case
        when p_country_code is null or length(trim(coalesce(p_country_code, ''))) = 0 then null
        when upper(trim(p_country_code)) in ('UK', 'GB') then 'GB'
        else upper(trim(p_country_code))
      end as norm_country
  )
  select
    b.id,
    b.name,
    b.slug,
    coalesce(b.website_display, b.website, '')::text as website,
    coalesce(m.trust_score, 0)::double precision as trust_score,
    coalesce(m.trust_score, 0)::double precision as average_rating,
    coalesce(m.trust_score, 0)::double precision as avg_rating,
    coalesce(m.review_count, 0)::bigint as review_count,
    b.category_slug,
    b.country_code,
    coalesce(b.address, '')::text as address,
    coalesce(b.city, '')::text as city,
    trim(concat_ws(', ', nullif(trim(coalesce(b.city, '')), ''), nullif(trim(coalesce(b.country_code, '')), '')))::text as display_location,
    b.logo_url::text as resolved_logo_url
  from public.businesses b
  cross join params p
  left join public.business_review_metrics_v m on m.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (p.cat_slug is not null and b.category_slug is not null and (
      lower(trim(b.category_slug)) = p.cat_slug
      or (p.cat_slug = 'banking' and lower(trim(b.category_slug)) = 'banking-and-money')
    ))
    or (
      b.secondary_category_slugs is not null
      and p.cat_slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = p.cat_slug
          or (p.cat_slug = 'banking' and lower(trim(s.s)) = 'banking-and-money')
      )
    )
  )
  and (
    p.norm_country is null
    or (
      case
        when upper(trim(coalesce(b.country_code, ''))) in ('UK', 'GB') then 'GB'
        else upper(trim(coalesce(b.country_code, '')))
      end = p.norm_country
    )
  )
  and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating)
  order by coalesce(m.trust_score, 0) desc, coalesce(m.review_count, 0) desc, b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Top businesses in category/country; uses business_review_metrics_v (fast). GB/UK normalized.';

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Category count: join metrics view (same as prod filters, no rev CTE)
-- ---------------------------------------------------------------------------
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
  with params as (
    select
      nullif(trim(lower(p_category_slug)), '') as cat_slug,
      case
        when p_country_code is null or length(trim(coalesce(p_country_code, ''))) = 0 then null
        when upper(trim(p_country_code)) in ('UK', 'GB') then 'GB'
        else upper(trim(p_country_code))
      end as norm_country
  )
  select (count(*)::bigint)::integer
  from public.businesses b
  cross join params p
  left join public.business_review_metrics_v m on m.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (p.cat_slug is not null and b.category_slug is not null and (
      lower(trim(b.category_slug)) = p.cat_slug
      or (p.cat_slug = 'banking' and lower(trim(b.category_slug)) = 'banking-and-money')
    ))
    or (
      b.secondary_category_slugs is not null
      and p.cat_slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = p.cat_slug
          or (p.cat_slug = 'banking' and lower(trim(s.s)) = 'banking-and-money')
      )
    )
  )
  and (
    p.norm_country is null
    or (
      case
        when upper(trim(coalesce(b.country_code, ''))) in ('UK', 'GB') then 'GB'
        else upper(trim(coalesce(b.country_code, '')))
      end = p.norm_country
    )
  )
  and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating);
$$;

grant execute on function public.get_category_business_count(text, text, double precision) to anon;
grant execute on function public.get_category_business_count(text, text, double precision) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) Home feed by country (indexed path; replaces heavy view scan for landing)
-- ---------------------------------------------------------------------------
drop function if exists public.get_home_feed_for_country(text, int);

create or replace function public.get_home_feed_for_country(
  p_country_code text,
  p_limit int default 96
)
returns table (
  review_id uuid,
  rating double precision,
  title text,
  body text,
  created_at timestamptz,
  guest_name text,
  reviewer_name text,
  like_count integer,
  country_code text,
  business_name text,
  business_slug text,
  website text,
  website_display text,
  logo_url text,
  review_count bigint,
  visibility text
)
language sql
stable
security definer
set search_path = public
as $$
  with cc as (
    select case
      when upper(trim(coalesce(p_country_code, ''))) in ('UK', 'GB') then 'GB'
      else upper(trim(coalesce(p_country_code, '')))
    end as norm
  )
  select
    r.id as review_id,
    r.rating::double precision,
    r.title,
    r.body,
    r.created_at,
    r.guest_name,
    r.guest_name::text as reviewer_name,
    coalesce(r.like_count, 0)::integer as like_count,
    b.country_code::text,
    b.name::text as business_name,
    b.slug::text as business_slug,
    coalesce(b.website, '')::text as website,
    coalesce(b.website_display, '')::text as website_display,
    coalesce(b.logo_url::text, '') as logo_url,
    coalesce(m.review_count, 0)::bigint as review_count,
    r.visibility::text
  from public.reviews r
  inner join public.businesses b on b.id = r.business_id
  cross join cc
  left join public.business_review_metrics_v m on m.business_id = b.id
  where (r.status is null or lower(trim(r.status::text)) = 'published')
    and coalesce(r.visibility, 'visible') = 'visible'
    and coalesce(b.status, 'active') = 'active'
    and (
      case
        when upper(trim(coalesce(b.country_code, ''))) in ('UK', 'GB') then 'GB'
        else upper(trim(coalesce(b.country_code, '')))
      end = cc.norm
    )
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 96), 1), 200);
$$;

comment on function public.get_home_feed_for_country(text, int) is
  'Recent published reviews for landing, filtered by business country (normalized).';

grant execute on function public.get_home_feed_for_country(text, int) to anon;
grant execute on function public.get_home_feed_for_country(text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- 4) Indexes (concurrent not used; safe for Supabase migration runner)
-- ---------------------------------------------------------------------------
create index if not exists idx_businesses_active_country_code
  on public.businesses (country_code)
  where coalesce(status, 'active') = 'active';

create index if not exists idx_reviews_business_created_pub_vis
  on public.reviews (business_id, created_at desc)
  where (status is null or lower(trim(status::text)) = 'published')
    and coalesce(visibility, 'visible') = 'visible';
