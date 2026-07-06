-- Category directory: rank businesses with published reviews ahead of zero-review
-- listings so medals (#1–#3) align with TrustScore ranking semantics.

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
              is distinct from lower(trim(coalesce(b.category_slug, '')))
        ),
        '[]'::jsonb
      )
    end as tags
  from public.businesses b
  cross join params p
  left join public.business_review_metrics_v m on m.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and p.cat_slug is not null
  and exists (
    select 1
    from unnest(public.expand_catalog_category_slug_aliases(p.cat_slug)) as alias(a)
    where nullif(trim(alias.a), '') is not null
      and (
        (
          b.category_slug is not null
          and lower(trim(b.category_slug)) = lower(trim(alias.a))
        )
        or (
          b.secondary_category_slugs is not null
          and exists (
            select 1
            from unnest(b.secondary_category_slugs) s(s)
            where lower(trim(s.s)) = lower(trim(alias.a))
          )
        )
      )
  )
  and (
    p.norm_country is null
    or public.normalize_country_code_home(b.country_code) = p.norm_country
  )
  and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating)
  order by
    (coalesce(m.review_count, 0) > 0) desc,
    coalesce(m.trust_score, 0) desc,
    coalesce(m.review_count, 0) desc,
    b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Category directory listing; reviewed businesses first, then TrustScore and review volume.';

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;

notify pgrst, 'reload schema';
