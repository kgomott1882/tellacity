-- Admin businesses list: filter by admin action preset (including restrict + landing hide).

drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, integer, integer);

create or replace function public.admin_list_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text,
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
  is_review_restricted boolean,
  exclude_reviews_from_home_feed boolean,
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
    coalesce(b.status::text, 'active') as status,
    coalesce(b.submission_status::text, '') as submission_status,
    coalesce(c.name, b.category_slug, '')::text as category,
    coalesce(b.category_slug, '')::text as category_slug,
    coalesce(b.is_review_restricted, false) as is_review_restricted,
    coalesce(b.exclude_reviews_from_home_feed, false) as exclude_reviews_from_home_feed,
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
      or lower(trim(coalesce(b.status::text, 'active'))) = lower(trim(status_filter))
    )
    and (
      submission_filter is null
      or length(trim(submission_filter)) = 0
      or lower(trim(coalesce(b.submission_status::text, ''))) = lower(trim(submission_filter))
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
    and (
      admin_action_filter is null
      or length(trim(admin_action_filter)) = 0
      or (
        lower(trim(admin_action_filter)) in ('activate', 'approved')
        and lower(trim(coalesce(b.status::text, 'active'))) = 'active'
        and lower(trim(coalesce(b.submission_status::text, ''))) = 'approved'
      )
      or (
        lower(trim(admin_action_filter)) = 'suspended'
        and lower(trim(coalesce(b.status::text, ''))) = 'suspended'
      )
      or (
        lower(trim(admin_action_filter)) = 'under_review'
        and lower(trim(coalesce(b.status::text, ''))) = 'under_review'
      )
      or (
        lower(trim(admin_action_filter)) = 'restrict'
        and coalesce(b.is_review_restricted, false) = true
      )
      or (
        lower(trim(admin_action_filter)) = 'hide_landing'
        and coalesce(b.exclude_reviews_from_home_feed, false) = true
      )
    )
  order by b.created_at desc nulls last, b.id desc
  limit (select least(greatest(coalesce(limit_count, 50), 1), 1000))
  offset (select greatest(coalesce(offset_count, 0), 0));
$$;

comment on function public.admin_list_businesses_v2(text, text, text, text, text, text, integer, integer) is
  'Admin: paginated businesses with admin_action_filter (activate, suspended, under_review, approved, restrict, hide_landing).';

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, text, integer, integer)
  to authenticated;

drop function if exists public.admin_count_businesses_v2(text, text, text, text, text);

create or replace function public.admin_count_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text
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
      or lower(trim(coalesce(b.status::text, 'active'))) = lower(trim(status_filter))
    )
    and (
      submission_filter is null
      or length(trim(submission_filter)) = 0
      or lower(trim(coalesce(b.submission_status::text, ''))) = lower(trim(submission_filter))
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
    and (
      admin_action_filter is null
      or length(trim(admin_action_filter)) = 0
      or (
        lower(trim(admin_action_filter)) in ('activate', 'approved')
        and lower(trim(coalesce(b.status::text, 'active'))) = 'active'
        and lower(trim(coalesce(b.submission_status::text, ''))) = 'approved'
      )
      or (
        lower(trim(admin_action_filter)) = 'suspended'
        and lower(trim(coalesce(b.status::text, ''))) = 'suspended'
      )
      or (
        lower(trim(admin_action_filter)) = 'under_review'
        and lower(trim(coalesce(b.status::text, ''))) = 'under_review'
      )
      or (
        lower(trim(admin_action_filter)) = 'restrict'
        and coalesce(b.is_review_restricted, false) = true
      )
      or (
        lower(trim(admin_action_filter)) = 'hide_landing'
        and coalesce(b.exclude_reviews_from_home_feed, false) = true
      )
    );
$$;

comment on function public.admin_count_businesses_v2(text, text, text, text, text, text) is
  'Admin: total count for admin_list_businesses_v2 with same filters.';

grant execute on function public.admin_count_businesses_v2(text, text, text, text, text, text) to authenticated;
