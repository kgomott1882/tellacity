-- Recently reviewed strip on category directory: top N businesses in this
-- category+country by time of their latest *public* review (not listing sort).

create or replace function public.get_recently_reviewed_businesses_for_category(
  p_category_slug text,
  p_country_code text,
  p_limit int default 3
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
  tags jsonb,
  secondary_category_slugs text[]
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
  ),
  public_reviews as (
    select
      r.business_id,
      max(r.created_at) as last_review_at
    from public.reviews r
    inner join public.businesses b on b.id = r.business_id
    cross join params p
    where (r.status is null or r.status = 'published')
      and (
        r.visibility is null
        or trim(coalesce(r.visibility::text, '')) = ''
        or r.visibility in ('visible', 'landing_hidden')
      )
      and coalesce(b.status, 'active') = 'active'
      and p.cat_slug is not null
      and (
        (b.category_slug is not null and (
          lower(trim(b.category_slug)) = p.cat_slug
          or (p.cat_slug = 'banking' and lower(trim(b.category_slug)) = 'banking-and-money')
        ))
        or (
          b.secondary_category_slugs is not null
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
    group by r.business_id
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
      when b.tags is null then '[]'::jsonb
      else to_jsonb(b.tags)
    end as tags,
    b.secondary_category_slugs
  from public_reviews pr
  inner join public.businesses b on b.id = pr.business_id
  left join public.business_review_metrics_v m on m.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  order by pr.last_review_at desc nulls last
  limit greatest(0, coalesce(p_limit, 3));
$$;

comment on function public.get_recently_reviewed_businesses_for_category(text, text, int) is
  'Category directory: businesses in category+country with the most recently published public review.';

grant execute on function public.get_recently_reviewed_businesses_for_category(text, text, int) to anon;
grant execute on function public.get_recently_reviewed_businesses_for_category(text, text, int) to authenticated;
