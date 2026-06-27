-- Admin "landing feed filter": reviews still publish on the business profile,
-- but the business is excluded from the public homepage feed (home_feed_v2).
-- Separate from is_review_restricted (which blocks new reviews entirely).

alter table public.businesses
  add column if not exists exclude_reviews_from_home_feed boolean not null default false;

create index if not exists businesses_exclude_reviews_from_home_feed_idx
  on public.businesses (exclude_reviews_from_home_feed)
  where exclude_reviews_from_home_feed = true;

comment on column public.businesses.exclude_reviews_from_home_feed is
  'When true, published reviews remain on the business page but are omitted from the Tellacity landing page feed.';

create or replace function public.admin_set_business_home_feed_exclusion(
  target_business_id uuid,
  excluded boolean
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
    exclude_reviews_from_home_feed = coalesce(excluded, false),
    updated_at = now()
  where id = target_business_id;
end;
$$;

comment on function public.admin_set_business_home_feed_exclusion(uuid, boolean) is
  'Admin: toggle businesses.exclude_reviews_from_home_feed; hides reviews from landing feed only.';

grant execute on function public.admin_set_business_home_feed_exclusion(uuid, boolean) to authenticated;

-- Extend admin_list_businesses_v2 for the admin table toggle.
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
  order by b.created_at desc nulls last, b.id desc
  limit (select least(greatest(coalesce(limit_count, 50), 1), 1000))
  offset (select greatest(coalesce(offset_count, 0), 0));
$$;

comment on function public.admin_list_businesses_v2(text, text, text, text, text, integer, integer) is
  'Admin: paginated businesses; includes is_review_restricted and exclude_reviews_from_home_feed.';

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, integer, integer)
  to authenticated;

-- Landing feed: omit businesses flagged by admin (reviews still on business profile).
create or replace view public.home_feed_v2 as
with ranked as (
  select
    r.id as review_id,
    r.business_id,
    r.rating,
    r.title,
    r.body,
    r.created_at,
    r.guest_name,
    r.visibility,
    r.is_flagged,
    b.name as business_name,
    b.website,
    b.slug as business_slug,
    b.country_code,
    b.logo_url,
    r.product_photo_id,
    bp.product_name,
    row_number() over (
      partition by lower(trim(b.name))
      order by r.created_at desc
    ) as rn
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  left join public.business_photos bp on bp.id = r.product_photo_id
  where coalesce(r.visibility, 'visible') = 'visible'
    and r.status = 'published'
    and coalesce(b.status, 'active') = 'active'
    and coalesce(b.exclude_reviews_from_home_feed, false) = false
    and b.website is not null
    and b.website <> ''
)
select
  review_id,
  business_id,
  rating,
  title,
  body,
  created_at,
  guest_name,
  visibility,
  is_flagged,
  business_name,
  website,
  business_slug,
  country_code,
  logo_url,
  rn,
  product_photo_id,
  product_name
from ranked
where rn = 1
order by created_at desc;

comment on view public.home_feed_v2 is
  'Public landing feed: active businesses, published visible reviews; excludes admin-flagged businesses.';

grant select on public.home_feed_v2 to anon, authenticated;
