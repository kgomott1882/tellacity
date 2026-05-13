-- Homepage "Best in …" and category directory: map marketing slugs to all catalog
-- slugs that should match (e.g. internet-and-software ↔ it-and-communication after
-- 20260802120000_businesses_category_slug_cleanup_fk). Keeps banking ↔ banking-and-money.

create or replace function public.expand_catalog_category_slug_aliases(p_slug text)
returns text[]
language sql
immutable
as $$
  with s as (
    select nullif(lower(trim(both from coalesce(p_slug, ''))), '') as slug
  )
  select case (select slug from s)
    when null then array[]::text[]
    when 'banking' then array['banking', 'banking-and-money']::text[]
    when 'banking-and-money' then array['banking', 'banking-and-money']::text[]
    when 'internet-and-software' then array['internet-and-software', 'it-and-communication']::text[]
    when 'insurance' then array[
      'insurance',
      'insurance-agency',
      'insurance-broker',
      'insurance-company',
      'life-insurance',
      'car-insurance',
      'home-insurance',
      'health-insurance',
      'travel-insurance',
      'pet-insurance',
      'business-insurance'
    ]::text[]
    else array[(select slug from s)]::text[]
  end;
$$;

comment on function public.expand_catalog_category_slug_aliases(text) is
  'Expand a UI/category-page slug to equivalent public.categories slugs (banking, IT, insurance variants).';

-- ---------------------------------------------------------------------------
-- get_home_best_in_bundle
-- ---------------------------------------------------------------------------

create or replace function public.get_home_best_in_bundle(
  p_country_code text default null,
  p_category_slugs text[] default null,
  p_candidate_limit int default 24,
  p_final_limit int default 8,
  p_min_rating double precision default null
)
returns table (
  home_category_slug text,
  id uuid,
  name text,
  slug text,
  website text,
  trust_score double precision,
  review_count bigint,
  resolved_logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    trim(u.bucket_slug)::text as home_category_slug,
    x.id,
    x.name,
    x.slug,
    x.website,
    x.live_trust_score::double precision as trust_score,
    x.live_review_count::bigint as review_count,
    x.resolved_logo_url
  from unnest(coalesce(p_category_slugs, array[]::text[])) with ordinality as u(bucket_slug, ord)
  cross join (
    select public.normalize_country_code_home(p_country_code) as norm_country
  ) n
  cross join lateral (
    select nullif(lower(trim(both from u.bucket_slug)), '') as cat_slug
  ) p
  cross join lateral (
    select
      c.id,
      c.name,
      c.slug,
      c.website,
      c.resolved_logo_url,
      c.live_review_count,
      c.live_trust_score
    from (
      select
        b.id,
        b.name,
        b.slug,
        coalesce(b.website_display, b.website, '')::text as website,
        b.logo_url::text as resolved_logo_url,
        coalesce(rev.review_count, 0)::bigint as live_review_count,
        coalesce(rev.average_rating, 0)::double precision as live_trust_score
      from public.businesses b
      left join public.business_review_metrics_v m on m.business_id = b.id
      left join lateral (
        select
          count(*)::bigint as review_count,
          avg(r.rating)::double precision as average_rating
        from public.reviews r
        where r.business_id = b.id
          and (
            r.status is null
            or lower(trim(r.status::text)) = 'published'
          )
          and coalesce(r.visibility, 'visible') = 'visible'
      ) rev on true
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
                  from unnest(b.secondary_category_slugs) s2(s2)
                  where lower(trim(s2.s2)) = lower(trim(alias.a))
                )
              )
            )
        )
        and (
          n.norm_country is null
          or public.normalize_country_code_home(b.country_code) = n.norm_country
        )
        and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating)
      order by coalesce(m.trust_score, 0) desc, coalesce(m.review_count, 0) desc, b.name asc
      limit greatest(0, coalesce(p_candidate_limit, 24))
    ) c
    order by c.live_trust_score desc, c.live_review_count desc, c.name asc
    limit greatest(0, coalesce(p_final_limit, 8))
  ) x
  where p.cat_slug is not null
  order by u.ord asc, x.live_trust_score desc, x.live_review_count desc, x.name asc;
$$;

comment on function public.get_home_best_in_bundle(text, text[], int, int, double precision) is
  'Homepage Best-in: top p_final_limit per slug; catalog slug aliases (IT, banking, insurance).';

grant execute on function public.get_home_best_in_bundle(text, text[], int, int, double precision) to anon;
grant execute on function public.get_home_best_in_bundle(text, text[], int, int, double precision) to authenticated;

-- ---------------------------------------------------------------------------
-- get_top_businesses_for_category_global
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
  order by coalesce(m.trust_score, 0) desc, coalesce(m.review_count, 0) desc, b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

comment on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) is
  'Category directory listing; slug aliases + tags from businesses.tags or secondary slugs.';

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- get_recently_reviewed_businesses_for_category
-- ---------------------------------------------------------------------------

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
  'Category directory: recently reviewed in category+country; slug aliases match homepage.';

grant execute on function public.get_recently_reviewed_businesses_for_category(text, text, int) to anon;
grant execute on function public.get_recently_reviewed_businesses_for_category(text, text, int) to authenticated;

notify pgrst, 'reload schema';
