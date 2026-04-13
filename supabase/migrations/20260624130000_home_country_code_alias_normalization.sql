-- Normalize common country aliases so homepage country switching always aligns
-- between Best-in RPCs and home feed.
--
-- IMPORTANT (manual runs in SQL Editor):
-- This file also replaces get_top_businesses_for_category_global, get_category_business_count,
-- and get_home_feed_for_country. If Postgres returns 42P13 ("cannot change return type"),
-- your database already has a newer signature (for example after
-- 20260701120000_rpc_include_business_tags.sql adds columns). Do not DROP shared RPCs on a
-- whim: dependents include category pages and business profiles. Prefer applying migrations
-- in repo order. If you only need the country helper on an already-newer DB, run
-- supabase/snippets/normalize_country_code_home_only.sql instead of this whole file.

create or replace function public.normalize_country_code_home(p_code text)
returns text
language sql
immutable
as $$
  select case
    when p_code is null then null
    when length(trim(p_code)) = 0 then null
    when upper(trim(p_code)) in ('UK', 'GB', 'GBR', 'UNITED KINGDOM') then 'GB'
    when upper(trim(p_code)) in ('US', 'USA', 'U.S.', 'U.S.A', 'UNITED STATES', 'UNITED STATES OF AMERICA') then 'US'
    when upper(trim(p_code)) in ('CA', 'CAN', 'CANADA') then 'CA'
    when upper(trim(p_code)) in ('ZA', 'ZAF', 'SOUTH AFRICA') then 'ZA'
    when upper(trim(p_code)) in ('AU', 'AUS', 'AUSTRALIA') then 'AU'
    when upper(trim(p_code)) in ('NZ', 'NZL', 'NEW ZEALAND') then 'NZ'
    when upper(trim(p_code)) in ('IE', 'IRL', 'IRELAND') then 'IE'
    else upper(trim(p_code))
  end;
$$;

comment on function public.normalize_country_code_home(text) is
  'Homepage country normalization (UK/GB, US/USA, CA/CAN, ZA/ZAF, AU/AUS, NZ/NZL, IE/IRL).';

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
      public.normalize_country_code_home(p_country_code) as norm_country
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
    or public.normalize_country_code_home(b.country_code) = p.norm_country
  )
  and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating)
  order by coalesce(m.trust_score, 0) desc, coalesce(m.review_count, 0) desc, b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

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
      public.normalize_country_code_home(p_country_code) as norm_country
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
    or public.normalize_country_code_home(b.country_code) = p.norm_country
  )
  and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating);
$$;

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
    select public.normalize_country_code_home(p_country_code) as norm
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
    and public.normalize_country_code_home(b.country_code) = cc.norm
  order by r.created_at desc
  limit least(greatest(coalesce(p_limit, 96), 1), 200);
$$;

grant execute on function public.normalize_country_code_home(text) to anon;
grant execute on function public.normalize_country_code_home(text) to authenticated;

