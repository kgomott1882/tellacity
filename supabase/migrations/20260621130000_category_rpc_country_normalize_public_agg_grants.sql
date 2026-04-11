-- Category rankings + live metrics: UK/GB + casing on country_code; safer review status match.
-- Grant batched aggregate RPC to anon (browser) so category pages match homepage metrics API.

-- ---------------------------------------------------------------------------
-- Batched aggregates (same filters as category RPC rev CTE after this file)
-- ---------------------------------------------------------------------------
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
    and (
      r.status is null
      or lower(trim(r.status::text)) = 'published'
    )
    and coalesce(r.visibility, 'visible') = 'visible'
  group by r.business_id;
$$;

comment on function public.get_public_review_aggregates(uuid[]) is
  'Published + visible review counts and averages for many businesses; status match is case-insensitive.';

grant execute on function public.get_public_review_aggregates(uuid[]) to anon;
grant execute on function public.get_public_review_aggregates(uuid[]) to authenticated;
grant execute on function public.get_public_review_aggregates(uuid[]) to service_role;

-- ---------------------------------------------------------------------------
-- Category list / count RPCs
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
  with params as (
    select
      nullif(trim(lower(p_category_slug)), '') as cat_slug,
      case
        when p_country_code is null or length(trim(coalesce(p_country_code, ''))) = 0 then null
        when upper(trim(p_country_code)) in ('UK', 'GB') then 'GB'
        else upper(trim(p_country_code))
      end as norm_country
  ),
  rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt
    from public.reviews r
    where (
      r.status is null
      or lower(trim(r.status::text)) = 'published'
    )
      and coalesce(r.visibility, 'visible') = 'visible'
    group by r.business_id
  )
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
  cross join params p
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (p.cat_slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = p.cat_slug)
    or (
      b.secondary_category_slugs is not null
      and p.cat_slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = p.cat_slug
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
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating)
  order by coalesce(rev.avg_rating, 0) desc, coalesce(rev.cnt, 0) desc, b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Top businesses in a category; live review aggregates; GB/UK country match; case-insensitive published status.';

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
  with params as (
    select
      nullif(trim(lower(p_category_slug)), '') as cat_slug,
      case
        when p_country_code is null or length(trim(coalesce(p_country_code, ''))) = 0 then null
        when upper(trim(p_country_code)) in ('UK', 'GB') then 'GB'
        else upper(trim(p_country_code))
      end as norm_country
  ),
  rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating
    from public.reviews r
    where (
      r.status is null
      or lower(trim(r.status::text)) = 'published'
    )
      and coalesce(r.visibility, 'visible') = 'visible'
    group by r.business_id
  )
  select (count(*)::bigint)::integer
  from public.businesses b
  cross join params p
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (p.cat_slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = p.cat_slug)
    or (
      b.secondary_category_slugs is not null
      and p.cat_slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = p.cat_slug
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
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating);
$$;

grant execute on function public.get_category_business_count(text, text, double precision) to anon;
grant execute on function public.get_category_business_count(text, text, double precision) to authenticated;
