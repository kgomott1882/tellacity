-- Extend admin_category_business_stats with published/live review counts per category
-- (same business matching rules as business_count). Set-based aggregation — no per-row
-- correlated subqueries (avoids statement timeout on large datasets).
--
-- Postgres cannot change RETURNS TABLE columns via CREATE OR REPLACE; drop first.

drop function if exists public.admin_category_business_stats(text, text, text);

create function public.admin_category_business_stats(
  p_country_code text default null,
  p_group_slug text default null,
  p_category_slug text default null
)
returns table (
  group_slug text,
  group_name text,
  category_slug text,
  category_name text,
  business_count bigint,
  review_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with filtered_businesses as (
    select
      b.id,
      b.category_slug,
      b.secondary_category_slugs
    from public.businesses b
    where coalesce(b.status, 'active') = 'active'
      and (
        p_country_code is null
        or length(trim(p_country_code)) = 0
        or upper(trim(coalesce(b.country_code, ''))) = upper(trim(p_country_code))
      )
  ),
  slug_links as (
    select distinct u.business_id, u.slug
    from (
      select
        fb.id as business_id,
        lower(trim(fb.category_slug)) as slug
      from filtered_businesses fb
      where fb.category_slug is not null
        and length(trim(fb.category_slug)) > 0
      union all
      select
        fb.id as business_id,
        lower(trim(s.s)) as slug
      from filtered_businesses fb
      cross join lateral unnest(coalesce(fb.secondary_category_slugs, '{}'::text[])) as s(s)
      where length(trim(s.s)) > 0
    ) u
    where u.slug is not null and length(trim(u.slug)) > 0
  ),
  business_counts as (
    select
      sl.slug,
      count(distinct sl.business_id)::bigint as business_count
    from slug_links sl
    group by sl.slug
  ),
  review_counts as (
    select
      sl.slug,
      count(distinct r.id)::bigint as review_count
    from public.reviews r
    inner join slug_links sl on sl.business_id = r.business_id
    where coalesce(r.status, 'published') in ('published', 'live')
    group by sl.slug
  )
  select
    g.slug::text as group_slug,
    coalesce(g.name, g.slug)::text as group_name,
    c.slug::text as category_slug,
    coalesce(c.name, c.slug)::text as category_name,
    coalesce(bc.business_count, 0)::bigint as business_count,
    coalesce(rc.review_count, 0)::bigint as review_count
  from public.categories c
  inner join public.category_groups g on g.slug = c.group_slug
  left join business_counts bc on bc.slug = lower(trim(c.slug))
  left join review_counts rc on rc.slug = lower(trim(c.slug))
  where (
      p_group_slug is null
      or length(trim(p_group_slug)) = 0
      or lower(trim(c.group_slug)) = lower(trim(p_group_slug))
    )
    and (
      p_category_slug is null
      or length(trim(p_category_slug)) = 0
      or lower(trim(c.slug)) = lower(trim(p_category_slug))
    )
  order by coalesce(bc.business_count, 0) asc nulls last,
    lower(coalesce(g.name, g.slug)),
    lower(coalesce(c.name, c.slug));
end;
$$;

comment on function public.admin_category_business_stats(text, text, text) is
  'Admin: active businesses and published/live reviews per catalog category (set-based; primary or secondary slug).';

grant execute on function public.admin_category_business_stats(text, text, text) to authenticated;

notify pgrst, 'reload schema';
