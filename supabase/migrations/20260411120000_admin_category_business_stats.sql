-- Admin: per-category business counts (primary category_slug OR secondary_category_slugs),
-- same matching rules as get_top_businesses_for_category_global. Optional filters:
-- country, category group (parent), leaf category slug.

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
  select
    g.slug::text as group_slug,
    coalesce(g.name, g.slug)::text as group_name,
    c.slug::text as category_slug,
    coalesce(c.name, c.slug)::text as category_name,
    (
      select count(*)::bigint
      from public.businesses b
      where coalesce(b.status, 'active') = 'active'
        and (
          p_country_code is null
          or length(trim(p_country_code)) = 0
          or upper(trim(coalesce(b.country_code, ''))) = upper(trim(p_country_code))
        )
        and (
          lower(trim(coalesce(b.category_slug, ''))) = lower(trim(c.slug))
          or (
            b.secondary_category_slugs is not null
            and exists (
              select 1
              from unnest(b.secondary_category_slugs) s(s)
              where lower(trim(s.s)) = lower(trim(c.slug))
            )
          )
        )
    ) as business_count
  from public.categories c
  inner join public.category_groups g on g.slug = c.group_slug
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
  order by business_count asc nulls last,
    lower(coalesce(g.name, g.slug)),
    lower(coalesce(c.name, c.slug));
end;
$$;

comment on function public.admin_category_business_stats(text, text, text) is
  'Admin: active businesses per catalog category (primary or secondary slug), optional country/group/category filters.';

grant execute on function public.admin_category_business_stats(text, text, text) to authenticated;

notify pgrst, 'reload schema';
