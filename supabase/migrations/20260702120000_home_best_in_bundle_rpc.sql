-- Homepage-only bundle: one round-trip for all "Best in" carousel slugs with live review metrics.
-- Country matching is inlined (same rules as public.normalize_country_code_home) so this
-- migration runs even when that helper is not present yet.
--
-- SAFE to paste alone in the SQL Editor: this file only creates/replaces
-- public.get_home_best_in_bundle(...). It does NOT drop or replace
-- get_top_businesses_for_category_global (category directory + business profile).

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
    select
      case
        when p_country_code is null then null::text
        when length(trim(p_country_code)) = 0 then null::text
        when upper(trim(p_country_code)) in ('UK', 'GB', 'GBR', 'UNITED KINGDOM') then 'GB'
        when upper(trim(p_country_code)) in ('US', 'USA', 'U.S.', 'U.S.A', 'UNITED STATES', 'UNITED STATES OF AMERICA') then 'US'
        when upper(trim(p_country_code)) in ('CA', 'CAN', 'CANADA') then 'CA'
        when upper(trim(p_country_code)) in ('ZA', 'ZAF', 'SOUTH AFRICA') then 'ZA'
        when upper(trim(p_country_code)) in ('AU', 'AUS', 'AUSTRALIA') then 'AU'
        when upper(trim(p_country_code)) in ('NZ', 'NZL', 'NEW ZEALAND') then 'NZ'
        when upper(trim(p_country_code)) in ('IE', 'IRL', 'IRELAND') then 'IE'
        else upper(trim(p_country_code))
      end as norm_country
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
        and (
          (
            b.category_slug is not null
            and (
              lower(trim(b.category_slug)) = p.cat_slug
              or (p.cat_slug = 'banking' and lower(trim(b.category_slug)) = 'banking-and-money')
            )
          )
          or (
            b.secondary_category_slugs is not null
            and exists (
              select 1
              from unnest(b.secondary_category_slugs) s2(s2)
              where lower(trim(s2.s2)) = p.cat_slug
                or (p.cat_slug = 'banking' and lower(trim(s2.s2)) = 'banking-and-money')
            )
          )
        )
        and (
          n.norm_country is null
          or (
            case
              when b.country_code is null then null::text
              when length(trim(b.country_code)) = 0 then null::text
              when upper(trim(b.country_code)) in ('UK', 'GB', 'GBR', 'UNITED KINGDOM') then 'GB'
              when upper(trim(b.country_code)) in ('US', 'USA', 'U.S.', 'U.S.A', 'UNITED STATES', 'UNITED STATES OF AMERICA') then 'US'
              when upper(trim(b.country_code)) in ('CA', 'CAN', 'CANADA') then 'CA'
              when upper(trim(b.country_code)) in ('ZA', 'ZAF', 'SOUTH AFRICA') then 'ZA'
              when upper(trim(b.country_code)) in ('AU', 'AUS', 'AUSTRALIA') then 'AU'
              when upper(trim(b.country_code)) in ('NZ', 'NZL', 'NEW ZEALAND') then 'NZ'
              when upper(trim(b.country_code)) in ('IE', 'IRL', 'IRELAND') then 'IE'
              else upper(trim(b.country_code))
            end
          ) = n.norm_country
        )
        and (p_min_rating is null or coalesce(m.trust_score, 0) >= p_min_rating)
      order by coalesce(m.trust_score, 0) desc, coalesce(m.review_count, 0) desc, b.name asc
      limit greatest(0, coalesce(p_candidate_limit, 24))
    ) c
    where coalesce(c.live_review_count, 0) > 0
    order by c.live_trust_score desc, c.live_review_count desc, c.name asc
    limit greatest(0, coalesce(p_final_limit, 8))
  ) x
  where p.cat_slug is not null
  order by u.ord asc, x.live_trust_score desc, x.live_review_count desc, x.name asc;
$$;

comment on function public.get_home_best_in_bundle(text, text[], int, int, double precision) is
  'Homepage Best-in carousel only: ranked rows per requested category slug with live published review counts (same filters as get_public_review_aggregates).';

grant execute on function public.get_home_best_in_bundle(text, text[], int, int, double precision) to anon;
grant execute on function public.get_home_best_in_bundle(text, text[], int, int, double precision) to authenticated;
