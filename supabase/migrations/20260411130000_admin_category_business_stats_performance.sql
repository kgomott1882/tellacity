-- Fix statement timeout: previous implementation ran one businesses scan per category.
-- This version aggregates once (primary + secondary slugs), then joins to categories.

create or replace function public.admin_category_business_stats(
  p_country_code text default null,
  p_group_slug text default null,
  p_category_slug text default null
)
returns table (
  group_slug text,
  group_name text,
  category_slug text,
  category_name text,
  business_count bigint
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
  biz_cat as (
    select distinct
      fb.id as business_id,
      lower(trim(x.slug)) as cat_slug
    from filtered_businesses fb
    cross join lateral (
      select trim(fb.category_slug::text) as slug
      where fb.category_slug is not null
        and length(trim(fb.category_slug::text)) > 0
      union all
      select trim(u.s::text) as slug
      from unnest(coalesce(fb.secondary_category_slugs, array[]::text[])) as u(s)
      where length(trim(u.s::text)) > 0
    ) x(slug)
  ),
  slug_counts as (
    select
      bc.cat_slug,
      count(*)::bigint as cnt
    from biz_cat bc
    group by bc.cat_slug
  )
  select
    g.slug::text as group_slug,
    coalesce(g.name, g.slug)::text as group_name,
    c.slug::text as category_slug,
    coalesce(c.name, c.slug)::text as category_name,
    coalesce(sc.cnt, 0)::bigint as business_count
  from public.categories c
  inner join public.category_groups g on g.slug = c.group_slug
  left join slug_counts sc on sc.cat_slug = lower(trim(c.slug::text))
  where (
      p_group_slug is null
      or length(trim(p_group_slug)) = 0
      or lower(trim(c.group_slug::text)) = lower(trim(p_group_slug))
    )
    and (
      p_category_slug is null
      or length(trim(p_category_slug)) = 0
      or lower(trim(c.slug::text)) = lower(trim(p_category_slug))
    )
  order by business_count asc nulls last,
    lower(coalesce(g.name, g.slug)),
    lower(coalesce(c.name, c.slug));
end;
$$;

comment on function public.admin_category_business_stats(text, text, text) is
  'Admin: active businesses per catalog category (single-pass aggregate; primary or secondary slug).';

grant execute on function public.admin_category_business_stats(text, text, text) to authenticated;

notify pgrst, 'reload schema';
