-- Public profile RPC: only return businesses that are publicly active (admin-suspended
-- and other non-active rows must not surface through this RPC).

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
  trust_score double precision,
  average_rating double precision,
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
set search_path to public
as $$
  with rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt,
      count(*) filter (where round(r.rating) = 1)::bigint as r1,
      count(*) filter (where round(r.rating) = 2)::bigint as r2,
      count(*) filter (where round(r.rating) = 3)::bigint as r3,
      count(*) filter (where round(r.rating) = 4)::bigint as r4,
      count(*) filter (where round(r.rating) = 5)::bigint as r5
    from public.reviews r
    where r.status = 'published'
      and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
    group by r.business_id
  )
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
    coalesce(rev.avg_rating, 0)::float::double precision as trust_score,
    coalesce(rev.avg_rating, 0)::float::double precision as average_rating,
    coalesce(rev.cnt, 0)::bigint as review_count,
    coalesce(rev.r1, 0)::bigint as rating_1_count,
    coalesce(rev.r2, 0)::bigint as rating_2_count,
    coalesce(rev.r3, 0)::bigint as rating_3_count,
    coalesce(rev.r4, 0)::bigint as rating_4_count,
    coalesce(rev.r5, 0)::bigint as rating_5_count
  from public.businesses b
  left join rev on rev.business_id = b.id
  left join public.categories c on c.slug = b.category_slug
  left join public.category_groups cg on cg.slug = coalesce(b.primary_group_slug, c.group_slug, b.category_slug)
  where b.slug = p_slug
    and coalesce(b.status, 'active') = 'active'
  limit 1;
$$;

comment on function public.get_business_by_slug(text) is
  'Public business profile by slug; returns only active businesses (suspended/hidden excluded).';

grant execute on function public.get_business_by_slug(text) to anon;
grant execute on function public.get_business_by_slug(text) to authenticated;
