-- Extend admin businesses v2 with country + category filters.

drop function if exists public.admin_list_businesses_v2(text, text, text, integer, integer);
drop function if exists public.admin_count_businesses_v2(text, text, text);

create or replace function public.admin_list_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  limit_count integer,
  offset_count integer
)
returns table (
  business_id uuid,
  id uuid,
  name text,
  website text,
  country text,
  country_code text,
  status text,
  submission_status text,
  category text,
  category_slug text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as business_id,
    b.id,
    coalesce(b.name, '')::text as name,
    coalesce(b.website, '')::text as website,
    coalesce(b.country_code, '')::text as country,
    coalesce(b.country_code, '')::text as country_code,
    coalesce(b.status, 'active')::text as status,
    coalesce(b.submission_status, '')::text as submission_status,
    coalesce(c.name, b.category_slug, '')::text as category,
    coalesce(b.category_slug, '')::text as category_slug,
    b.created_at
  from public.businesses b
  left join public.categories c on c.slug = b.category_slug
  where public.is_current_user_admin()
    and (
      search_term is null
      or length(trim(search_term)) = 0
      or b.name ilike '%' || trim(search_term) || '%'
      or b.id::text ilike '%' || trim(search_term) || '%'
      or replace(b.id::text, '-', '') ilike '%' || replace(trim(search_term), '-', '') || '%'
    )
    and (
      status_filter is null
      or length(trim(status_filter)) = 0
      or lower(trim(coalesce(b.status, 'active'))) = lower(trim(status_filter))
    )
    and (
      submission_filter is null
      or length(trim(submission_filter)) = 0
      or lower(trim(coalesce(b.submission_status, ''))) = lower(trim(submission_filter))
    )
    and (
      country_filter is null
      or length(trim(country_filter)) = 0
      or upper(trim(coalesce(b.country_code, ''))) = upper(trim(country_filter))
    )
    and (
      category_filter is null
      or length(trim(category_filter)) = 0
      or lower(trim(coalesce(b.category_slug, ''))) = lower(trim(category_filter))
    )
  order by b.created_at desc nulls last, b.id desc
  limit (select least(greatest(coalesce(limit_count, 50), 1), 1000))
  offset (select greatest(coalesce(offset_count, 0), 0));
$$;

comment on function public.admin_list_businesses_v2(text, text, text, text, text, integer, integer) is
  'Admin: paginated businesses with search, status, submission, country, and category filters.';

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, integer, integer)
  to authenticated;

create or replace function public.admin_count_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text
)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.businesses b
  where public.is_current_user_admin()
    and (
      search_term is null
      or length(trim(search_term)) = 0
      or b.name ilike '%' || trim(search_term) || '%'
      or b.id::text ilike '%' || trim(search_term) || '%'
      or replace(b.id::text, '-', '') ilike '%' || replace(trim(search_term), '-', '') || '%'
    )
    and (
      status_filter is null
      or length(trim(status_filter)) = 0
      or lower(trim(coalesce(b.status, 'active'))) = lower(trim(status_filter))
    )
    and (
      submission_filter is null
      or length(trim(submission_filter)) = 0
      or lower(trim(coalesce(b.submission_status, ''))) = lower(trim(submission_filter))
    )
    and (
      country_filter is null
      or length(trim(country_filter)) = 0
      or upper(trim(coalesce(b.country_code, ''))) = upper(trim(country_filter))
    )
    and (
      category_filter is null
      or length(trim(category_filter)) = 0
      or lower(trim(coalesce(b.category_slug, ''))) = lower(trim(category_filter))
    );
$$;

comment on function public.admin_count_businesses_v2(text, text, text, text, text) is
  'Admin: total count for admin_list_businesses_v2 with same filters.';

grant execute on function public.admin_count_businesses_v2(text, text, text, text, text) to authenticated;

-- Category options for admin filter dropdown (avoids relying on categories RLS).
create or replace function public.admin_list_category_filter_options()
returns table (
  slug text,
  name text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.slug::text, coalesce(c.name, c.slug)::text as name
  from public.categories c
  where public.is_current_user_admin()
  order by lower(coalesce(c.name, c.slug)), c.slug;
$$;

comment on function public.admin_list_category_filter_options() is
  'Admin: slugs and names for category filter on business list.';

grant execute on function public.admin_list_category_filter_options() to authenticated;
