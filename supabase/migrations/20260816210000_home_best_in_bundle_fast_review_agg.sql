-- Homepage Best-in:
-- 1) Two-phase reviews: candidates by metrics only, then one grouped scan on reviews (bounded).
-- 2) Precompute lowered slug aliases once per bucket (no per-row expand + nested EXISTS).
-- 3) PL/pgSQL + set_config(statement_timeout) so honest workloads finish under pool limits.

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
language plpgsql
volatile
security definer
set search_path = public
as $function$
begin
  -- Local to this transaction; allows larger home-page bundle without changing DB-wide default.
  perform set_config('statement_timeout', '120s', true);

  return query
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
      coalesce(
        array_agg(lower(trim(aa))) filter (where nullif(trim(aa), '') is not null),
        array[]::text[]
      ) as alias_lower
    from unnest(public.expand_catalog_category_slug_aliases(p.cat_slug)) as z(aa)
  ) al
  cross join lateral (
    with cand as (
      select
        b.id,
        b.name,
        b.slug,
        coalesce(b.website_display, b.website, '')::text as website,
        b.logo_url::text as resolved_logo_url
      from public.businesses b
      left join public.business_review_metrics_v m on m.business_id = b.id
      where coalesce(b.status, 'active') = 'active'
        and p.cat_slug is not null
        and cardinality(al.alias_lower) > 0
        and (
          (
            b.category_slug is not null
            and lower(trim(b.category_slug)) = any (al.alias_lower)
          )
          or (
            b.secondary_category_slugs is not null
            and exists (
              select 1
              from unnest(b.secondary_category_slugs) as s2(s2)
              where lower(trim(s2.s2)) = any (al.alias_lower)
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
    ),
    rev as (
      select
        r.business_id,
        count(*)::bigint as review_count,
        avg(r.rating)::double precision as average_rating
      from public.reviews r
      inner join cand on cand.id = r.business_id
      where (
          r.status is null
          or lower(trim(r.status::text)) = 'published'
        )
        and coalesce(r.visibility, 'visible') = 'visible'
      group by r.business_id
    )
    select
      c.id,
      c.name,
      c.slug,
      c.website,
      c.resolved_logo_url,
      coalesce(rv.review_count, 0)::bigint as live_review_count,
      coalesce(rv.average_rating, 0)::double precision as live_trust_score
    from cand c
    left join rev rv on rv.business_id = c.id
    order by live_trust_score desc, live_review_count desc, c.name asc
    limit greatest(0, coalesce(p_final_limit, 8))
  ) x
  where p.cat_slug is not null
    and cardinality(al.alias_lower) > 0
  order by u.ord asc, x.live_trust_score desc, x.live_review_count desc, x.name asc;
end;
$function$;

comment on function public.get_home_best_in_bundle(text, text[], int, int, double precision) is
  'Homepage Best-in: two-phase + precomputed slug aliases; 120s local statement_timeout.';

grant execute on function public.get_home_best_in_bundle(text, text[], int, int, double precision) to anon;
grant execute on function public.get_home_best_in_bundle(text, text[], int, int, double precision) to authenticated;

notify pgrst, 'reload schema';
