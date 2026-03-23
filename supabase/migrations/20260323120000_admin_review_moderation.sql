-- Moderation: visibility (separate from reviews.status = publication workflow published/null/draft).
-- Hidden reviews are excluded from public aggregates (same rules as published-only + visible).

-- 1) Columns on reviews
alter table public.reviews
  add column if not exists visibility_status text;

update public.reviews
set visibility_status = coalesce(visibility_status, 'visible');

alter table public.reviews
  alter column visibility_status set default 'visible';

alter table public.reviews
  alter column visibility_status set not null;

alter table public.reviews
  add column if not exists flagged boolean;

update public.reviews
set flagged = coalesce(flagged, false);

alter table public.reviews
  alter column flagged set default false;

alter table public.reviews
  alter column flagged set not null;

alter table public.reviews
  drop constraint if exists reviews_visibility_status_chk;

alter table public.reviews
  add constraint reviews_visibility_status_chk
  check (visibility_status in ('visible', 'hidden'));

comment on column public.reviews.visibility_status is
  'Moderation: visible (default) or hidden (soft-hide from public).';

comment on column public.reviews.flagged is
  'Moderation: marked for attention in admin.';

-- 2) Admin guard (used by SECURITY DEFINER RPCs)
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

comment on function public.is_current_user_admin() is
  'True when profiles.is_admin for auth.uid().';

grant execute on function public.is_current_user_admin() to authenticated;

-- 3) Update moderation fields (target status = visibility_status)
create or replace function public.admin_update_review_status(
  target_review_id uuid,
  new_status text,
  new_flagged boolean
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

  if new_status is null or new_status not in ('visible', 'hidden') then
    raise exception 'Invalid moderation status';
  end if;

  update public.reviews
  set
    visibility_status = new_status,
    flagged = new_flagged
  where id = target_review_id;
end;
$$;

comment on function public.admin_update_review_status(uuid, text, boolean) is
  'Admin: set reviews.visibility_status (visible/hidden) and flagged.';

grant execute on function public.admin_update_review_status(uuid, text, boolean) to authenticated;

-- 4) Public aggregates: only published (or null status) AND visible
create or replace view public.business_review_metrics_v as
select
  r.business_id,
  count(*)::bigint as review_count,
  avg(r.rating)::float as average_rating
from public.reviews r
where (r.status is null or r.status = 'published')
  and coalesce(r.visibility_status, 'visible') = 'visible'
group by r.business_id;

comment on view public.business_review_metrics_v is
  'Aggregates for public listings: published (or null status) and visibility visible only.';

-- 5) get_business_by_slug: same review filter in lateral aggregates
create or replace function public.get_business_by_slug(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  website text,
  website_display text,
  resolved_logo_url text,
  address text,
  city text,
  country_code text,
  description text,
  category_slug text,
  primary_group_slug text,
  primary_group_name text,
  category_name text,
  status text,
  email text,
  phone text,
  trust_score float,
  average_rating float,
  review_count bigint,
  rating_1_count bigint,
  rating_2_count bigint,
  rating_3_count bigint,
  rating_4_count bigint,
  rating_5_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.name,
    b.slug,
    coalesce(b.website, '')::text as website,
    coalesce(b.website_display, b.website, '')::text as website_display,
    coalesce(b.logo_url, null)::text as resolved_logo_url,
    coalesce(b.address, '')::text as address,
    coalesce(b.city, '')::text as city,
    coalesce(b.country_code, '')::text as country_code,
    coalesce(b.description, '')::text as description,
    coalesce(b.category_slug, '')::text as category_slug,
    coalesce(b.primary_group_slug, cg.slug)::text as primary_group_slug,
    cg.name::text as primary_group_name,
    c.name::text as category_name,
    coalesce(b.status, 'active')::text as status,
    b.email,
    b.phone,
    coalesce(rev.avg_rating, 0)::float as trust_score,
    coalesce(rev.avg_rating, 0)::float as average_rating,
    coalesce(rev.cnt, 0)::bigint as review_count,
    coalesce(rev.r1, 0)::bigint as rating_1_count,
    coalesce(rev.r2, 0)::bigint as rating_2_count,
    coalesce(rev.r3, 0)::bigint as rating_3_count,
    coalesce(rev.r4, 0)::bigint as rating_4_count,
    coalesce(rev.r5, 0)::bigint as rating_5_count
  from public.businesses b
  left join public.categories c on c.slug = b.category_slug
  left join public.category_groups cg on cg.slug = coalesce(b.primary_group_slug, c.group, b.category_slug)
  left join lateral (
    select
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt,
      count(*) filter (where round(r.rating) = 1)::bigint as r1,
      count(*) filter (where round(r.rating) = 2)::bigint as r2,
      count(*) filter (where round(r.rating) = 3)::bigint as r3,
      count(*) filter (where round(r.rating) = 4)::bigint as r4,
      count(*) filter (where round(r.rating) = 5)::bigint as r5
    from public.reviews r
    where r.business_id = b.id
      and (r.status is null or r.status = 'published')
      and coalesce(r.visibility_status, 'visible') = 'visible'
  ) rev on true
  where b.slug = p_slug
  limit 1;
$$;

comment on function public.get_business_by_slug(text) is
  'Business profile; aggregates exclude hidden reviews.';

-- 6) Category RPCs: same visibility filter on review aggregates
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
  trust_score float,
  average_rating float,
  avg_rating float,
  review_count bigint,
  category_slug text,
  country_code text,
  address text,
  city text,
  display_location text,
  resolved_logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  with rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt
    from public.reviews r
    where (r.status is null or r.status = 'published')
      and coalesce(r.visibility_status, 'visible') = 'visible'
    group by r.business_id
  ),
  cat_slug as (select nullif(trim(lower(p_category_slug)), '') as slug)
  select
    b.id,
    b.name,
    b.slug,
    coalesce(b.website_display, b.website, '')::text as website,
    coalesce(rev.avg_rating, 0)::float as trust_score,
    coalesce(rev.avg_rating, 0)::float as average_rating,
    coalesce(rev.avg_rating, 0)::float as avg_rating,
    coalesce(rev.cnt, 0)::bigint as review_count,
    b.category_slug,
    b.country_code,
    coalesce(b.address, '')::text as address,
    coalesce(b.city, '')::text as city,
    trim(concat_ws(', ', nullif(trim(coalesce(b.city, '')), ''), nullif(trim(coalesce(b.country_code, '')), '')))::text as display_location,
    b.logo_url::text as resolved_logo_url
  from public.businesses b
  cross join cat_slug cs
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (cs.slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = cs.slug)
    or (
      b.secondary_category_slugs is not null
      and cs.slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = cs.slug
      )
    )
  )
  and (p_country_code is null or b.country_code = p_country_code)
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating)
  order by coalesce(rev.avg_rating, 0) desc, coalesce(rev.cnt, 0) desc, b.name asc
  limit greatest(0, p_limit)
  offset greatest(0, p_offset);
$$;

grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to anon;
grant execute on function public.get_top_businesses_for_category_global(text, text, double precision, int, int) to authenticated;

drop function if exists public.get_category_business_count(text, text, float);
drop function if exists public.get_category_business_count(text, text, numeric);
drop function if exists public.get_category_business_count(text, text, double precision);

create or replace function public.get_category_business_count(
  p_category_slug text,
  p_country_code text default null,
  p_min_rating double precision default null
)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating
    from public.reviews r
    where (r.status is null or r.status = 'published')
      and coalesce(r.visibility_status, 'visible') = 'visible'
    group by r.business_id
  ),
  cat_slug as (select nullif(trim(lower(p_category_slug)), '') as slug)
  select (count(*)::bigint)::integer
  from public.businesses b
  cross join cat_slug cs
  left join rev on rev.business_id = b.id
  where coalesce(b.status, 'active') = 'active'
  and (
    (cs.slug is not null and b.category_slug is not null and lower(trim(b.category_slug)) = cs.slug)
    or (
      b.secondary_category_slugs is not null
      and cs.slug is not null
      and exists (
        select 1 from unnest(b.secondary_category_slugs) s(s)
        where lower(trim(s.s)) = cs.slug
      )
    )
  )
  and (p_country_code is null or b.country_code = p_country_code)
  and (p_min_rating is null or coalesce(rev.avg_rating, 0) >= p_min_rating);
$$;

grant execute on function public.get_category_business_count(text, text, double precision) to anon;
grant execute on function public.get_category_business_count(text, text, double precision) to authenticated;

drop index if exists public.reviews_public_by_business_idx;

create index if not exists reviews_public_by_business_idx
  on public.reviews (business_id)
  where (status is null or status = 'published')
    and coalesce(visibility_status, 'visible') = 'visible';

-- 7) Admin list reviews: optional moderation_filter (all | unverified | flagged)
drop function if exists public.admin_list_reviews(text, text, integer, integer);
drop function if exists public.admin_list_reviews(text, text, integer, integer, text);

create or replace function public.admin_list_reviews(
  search_term text,
  verification_filter text,
  limit_count integer,
  offset_count integer,
  moderation_filter text default 'all'
)
returns table (
  review_id uuid,
  business_name text,
  rating numeric,
  title text,
  body text,
  body_preview text,
  verification_status text,
  status text,
  visibility_status text,
  flagged boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    b.name::text,
    r.rating,
    r.title::text,
    r.body::text,
    left(coalesce(r.body, ''), 200)::text,
    case when r.verified_at is not null then 'verified' else 'unverified' end::text,
    r.status::text,
    r.visibility_status::text,
    r.flagged,
    r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where public.is_current_user_admin()
    and (
      search_term is null
      or trim(search_term) = ''
      or b.name ilike '%' || trim(search_term) || '%'
      or coalesce(r.title, '') ilike '%' || trim(search_term) || '%'
      or coalesce(r.body, '') ilike '%' || trim(search_term) || '%'
    )
    and (
      verification_filter is null
      or trim(verification_filter) = ''
      or (lower(trim(verification_filter)) = 'unverified' and r.verified_at is null)
      or (lower(trim(verification_filter)) = 'verified' and r.verified_at is not null)
    )
    and (
      moderation_filter is null
      or trim(moderation_filter) = ''
      or lower(trim(moderation_filter)) = 'all'
      or (lower(trim(moderation_filter)) = 'unverified' and r.verified_at is null)
      or (lower(trim(moderation_filter)) = 'flagged' and r.flagged = true)
    )
  order by r.created_at desc
  limit least(greatest(coalesce(nullif(limit_count, 0), 50), 1), 500)
  offset greatest(0, coalesce(offset_count, 0));
$$;

comment on function public.admin_list_reviews(text, text, integer, integer, text) is
  'Admin-only review list with moderation filter (all | unverified | flagged).';

grant execute on function public.admin_list_reviews(text, text, integer, integer, text) to authenticated;

grant execute on function public.get_business_by_slug(text) to anon;
grant execute on function public.get_business_by_slug(text) to authenticated;
