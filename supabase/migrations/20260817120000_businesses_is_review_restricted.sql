-- Admin "Restrict reviews" flag (separate from suspension).
-- Goal: block new reviews for a business while keeping the business publicly visible.
-- Surfaced in AdminBusinessesTable (Restrict action) and consumed by:
--   - app/api/admin/businesses/restrict (toggle)
--   - src/lib/businessPublicAccess.ts (assertBusinessAcceptsPublicReviews)
--   - src/components/reviews/WriteReviewForm.tsx (popup modal)

alter table public.businesses
  add column if not exists is_review_restricted boolean not null default false;

create index if not exists businesses_is_review_restricted_idx
  on public.businesses (is_review_restricted)
  where is_review_restricted = true;

comment on column public.businesses.is_review_restricted is
  'When true, /write-review and review APIs block new reviews for this business, but the business stays visible.';

create or replace function public.admin_set_business_review_restriction(
  target_business_id uuid,
  restricted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  update public.businesses
  set
    is_review_restricted = coalesce(restricted, false),
    updated_at = now()
  where id = target_business_id;
end;
$$;

comment on function public.admin_set_business_review_restriction(uuid, boolean) is
  'Admin: toggle businesses.is_review_restricted; blocks new reviews while keeping the business visible.';

grant execute on function public.admin_set_business_review_restriction(uuid, boolean) to authenticated;

-- Extend admin_list_businesses_v2 to expose is_review_restricted to the admin table.
drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, integer, integer);

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
  is_review_restricted boolean,
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
  order by b.created_at desc nulls last, b.id desc
  limit (select least(greatest(coalesce(limit_count, 50), 1), 1000))
  offset (select greatest(coalesce(offset_count, 0), 0));
$$;

comment on function public.admin_list_businesses_v2(text, text, text, text, text, integer, integer) is
  'Admin: paginated businesses with search, status, submission, country, category filters; includes is_review_restricted.';

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, integer, integer)
  to authenticated;
