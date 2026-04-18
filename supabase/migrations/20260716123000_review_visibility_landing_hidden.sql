-- Add a landing-only review visibility state.
-- Production facts this migration targets:
-- - reviews.visibility is text with a CHECK constraint (reviews_visibility_chk)
-- - admin_update_review_status signature is (new_flagged boolean, new_status text, target_review_id uuid)
-- - business_review_metrics_v columns are: business_id uuid, review_count integer, trust_score numeric
-- - home_feed_v2 is a ranked CTE view that only includes coalesce(visibility,'visible') = 'visible'
--
-- Semantics:
-- - hidden: excluded from public surfaces that respect visibility
-- - landing_hidden: excluded from landing feed (still coalesce(...)=visible is false) but included in business-facing aggregates
-- - visible: included everywhere appropriate

alter table public.reviews drop constraint if exists reviews_visibility_chk;

alter table public.reviews
  add constraint reviews_visibility_chk
  check (visibility in ('visible', 'hidden', 'landing_hidden'));

comment on column public.reviews.visibility is
  'Moderation: visible, hidden everywhere, or hidden from homepage recent reviews only.';

-- Keep the historical shape/types for this view (review_count is INTEGER in production).
create or replace view public.business_review_metrics_v as
select
  r.business_id,
  (count(*) filter (
    where r.status = 'published'
      and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
  ))::integer as review_count,
  round(
    avg(r.rating) filter (
      where r.status = 'published'
        and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
    ),
    2
  ) as trust_score
from public.reviews r
group by r.business_id;

comment on view public.business_review_metrics_v is
  'Published reviews only; excludes fully hidden reviews; includes landing_hidden.';

create or replace function public.get_public_review_aggregates(p_business_ids uuid[])
returns table (
  business_id uuid,
  review_count bigint,
  average_rating double precision
)
language sql
stable
security definer
set search_path to public
as $$
  select
    r.business_id,
    count(*)::bigint as review_count,
    avg(r.rating)::double precision as average_rating
  from public.reviews r
  where r.business_id = any(p_business_ids)
    and (
      r.status is null
      or lower(trim(r.status::text)) = 'published'
    )
    and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
  group by r.business_id;
$$;

comment on function public.get_public_review_aggregates(uuid[]) is
  'Published + public-visible review counts and averages for many businesses.';

grant execute on function public.get_public_review_aggregates(uuid[]) to service_role;

-- Match production signature + error strings, but allow landing_hidden.
create or replace function public.admin_update_review_status(
  new_flagged boolean default null,
  new_status text default null,
  target_review_id uuid default null
)
returns void
language plpgsql
security definer
set search_path to public
as $$
begin
  if target_review_id is null then
    raise exception 'target_review_id is required';
  end if;

  if new_flagged is null and new_status is null then
    return;
  end if;

  if new_status is not null and new_status not in ('visible', 'hidden', 'landing_hidden') then
    raise exception 'Invalid visibility value: %', new_status;
  end if;

  update public.reviews
  set
    is_flagged = coalesce(new_flagged, is_flagged),
    visibility = coalesce(new_status, visibility),
    updated_at = now()
  where id = target_review_id;
end;
$$;

-- Business profile RPC: keep return shape, tighten aggregates to respect visibility.
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
  trust_score double precision,
  average_rating double precision,
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
set search_path to public
as $$
  with rev as (
    select
      r.business_id,
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as cnt,
      count(*) filter (where round(r.rating) = 1)::bigint as r1,
      count(*) filter (where round(r.rating) = 2)::bigint as r2,
      count(*) filter (where round(r.rating) = 3)::bigint as r3,
      count(*) filter (where round(r.rating) = 4)::bigint as r4,
      count(*) filter (where round(r.rating) = 5)::bigint as r5
    from public.reviews r
    where r.status = 'published'
      and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
    group by r.business_id
  )
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
    coalesce(rev.avg_rating, 0)::float::double precision as trust_score,
    coalesce(rev.avg_rating, 0)::float::double precision as average_rating,
    coalesce(rev.cnt, 0)::bigint as review_count,
    coalesce(rev.r1, 0)::bigint as rating_1_count,
    coalesce(rev.r2, 0)::bigint as rating_2_count,
    coalesce(rev.r3, 0)::bigint as rating_3_count,
    coalesce(rev.r4, 0)::bigint as rating_4_count,
    coalesce(rev.r5, 0)::bigint as rating_5_count
  from public.businesses b
  left join rev on rev.business_id = b.id
  left join public.categories c on c.slug = b.category_slug
  left join public.category_groups cg on cg.slug = coalesce(b.primary_group_slug, c.group_slug, b.category_slug)
  where b.slug = p_slug
  limit 1;
$$;

grant execute on function public.get_business_by_slug(text) to anon;
grant execute on function public.get_business_by_slug(text) to authenticated;

-- Landing feed: keep production behavior (only fully visible), do not reference landing_hidden here.
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
    row_number() over (
      partition by lower(trim(b.name))
      order by r.created_at desc
    ) as rn
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  where coalesce(r.visibility, 'visible') = 'visible'
    and r.status = 'published'
    and coalesce(b.status, 'active') = 'active'
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
  rn
from ranked
where rn = 1
order by created_at desc;

grant select on public.home_feed_v2 to anon, authenticated;

-- Widget payload: production signature uses (text, integer).
create or replace function public.get_widget_payload_v1(
  p_business_slug text,
  p_limit integer default 5
)
returns jsonb
language sql
stable
security definer
set search_path to public
as $$
  select
    case
      when b.id is null then jsonb_build_object('error', 'Business not found')
      else jsonb_build_object(
        'business_name',  b.name,
        'slug',           b.slug,
        'logo_url',       b.logo_url,
        'avg_rating',     round(coalesce(stats.avg_rating, 0)::numeric, 2),
        'review_count',   coalesce(stats.review_count, 0),
        'reviews', (
          select coalesce(jsonb_agg(
            jsonb_build_object(
              'id',            r.id,
              'rating',        r.rating,
              'title',         r.title,
              'body',          r.body,
              'reviewer_name', r.guest_name,
              'created_at',    r.created_at
            )
            order by r.created_at desc
          ), '[]'::jsonb)
          from public.reviews r
          where r.business_id = b.id
            and r.status = 'published'
            and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
          limit greatest(1, least(20, p_limit))
        )
      )
    end
  from public.businesses b
  left join lateral (
    select
      avg(r.rating)::float as avg_rating,
      count(*)::bigint as review_count
    from public.reviews r
    where r.business_id = b.id
      and r.status = 'published'
      and coalesce(r.visibility, 'visible') in ('visible', 'landing_hidden')
  ) stats on true
  where b.slug = p_business_slug
    and coalesce(b.status, 'active') = 'active'
  limit 1;
$$;

grant execute on function public.get_widget_payload_v1(text, integer) to anon;
grant execute on function public.get_widget_payload_v1(text, integer) to authenticated;
