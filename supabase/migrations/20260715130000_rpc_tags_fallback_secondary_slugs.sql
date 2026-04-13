-- When businesses.tags is null or an empty array, surface secondary_category_slugs
-- as the tags jsonb array (excluding the primary category_slug) so category and
-- profile UIs still show keyword chips. Applies after 20260701120000_rpc_include_business_tags.

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
  rating_5_count bigint,
  tags jsonb
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
    coalesce(rev.r5, 0)::bigint as rating_5_count,
    case
      when b.tags is not null
        and jsonb_typeof(to_jsonb(b.tags)) = 'array'
        and jsonb_array_length(to_jsonb(b.tags)) > 0
        then to_jsonb(b.tags)
      when b.tags is not null
        and jsonb_typeof(to_jsonb(b.tags)) <> 'array'
        then to_jsonb(b.tags)
      else coalesce(
        (
          select jsonb_agg(to_jsonb(trim(s)) order by s)
          from unnest(coalesce(b.secondary_category_slugs, array[]::text[])) as u(s)
          where nullif(trim(s), '') is not null
            and lower(trim(s))
              is distinct from lower(trim(coalesce(b.category_slug, ''))))
        ),
        '[]'::jsonb
      )
    end as tags
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
      and coalesce(r.visibility, 'visible') = 'visible'
  ) rev on true
  where b.slug = p_slug
  limit 1;
$$;

comment on function public.get_business_by_slug(text) is
  'Public business profile row by slug; tags from businesses.tags or secondary_category_slugs when empty.';

grant execute on function public.get_business_by_slug(text) to anon;
grant execute on function public.get_business_by_slug(text) to authenticated;

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
  resolved_logo_url text,
  tags jsonb
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
    b.logo_url::text as resolved_logo_url,
    case
      when b.tags is not null
        and jsonb_typeof(to_jsonb(b.tags)) = 'array'
        and jsonb_array_length(to_jsonb(b.tags)) > 0
        then to_jsonb(b.tags)
      when b.tags is not null
        and jsonb_typeof(to_jsonb(b.tags)) <> 'array'
        then to_jsonb(b.tags)
      else coalesce(
        (
          select jsonb_agg(to_jsonb(trim(s)) order by s)
          from unnest(coalesce(b.secondary_category_slugs, array[]::text[])) as u(s)
          where nullif(trim(s), '') is not null
            and lower(trim(s))
              is distinct from lower(trim(coalesce(b.category_slug, ''))))
        ),
        '[]'::jsonb
      )
    end as tags
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

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Category directory listing; tags from businesses.tags or secondary_category_slugs when empty.';

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;
