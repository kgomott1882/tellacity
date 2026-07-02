-- Review fraud risk: columns, admin RPC/view updates.

alter table public.reviews add column if not exists ip_address inet;
alter table public.reviews add column if not exists risk_score smallint;
alter table public.reviews add column if not exists risk_status text;
alter table public.reviews add column if not exists moderation_reason text;
alter table public.reviews add column if not exists moderated_at timestamptz;
alter table public.reviews add column if not exists moderated_by uuid;
alter table public.reviews add column if not exists moderation_status text;

comment on column public.reviews.ip_address is 'Submitter IP at review creation (proxy-aware).';
comment on column public.reviews.risk_score is 'Fraud risk score 0-100.';
comment on column public.reviews.risk_status is 'Fraud risk band: low, medium, high.';
comment on column public.reviews.moderation_reason is 'JSON array of human-readable risk reasons.';

-- Highest risk among a business's reviews (high > medium > low).
create or replace function public.business_highest_review_risk(p_business_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.risk_status
  from public.reviews r
  where r.business_id = p_business_id
    and r.risk_status is not null
    and trim(r.risk_status) <> ''
  order by
    case lower(trim(r.risk_status))
      when 'high' then 3
      when 'medium' then 2
      when 'low' then 1
      else 0
    end desc,
    r.created_at desc
  limit 1;
$$;

-- Admin businesses list: add highest_review_risk + risk_filter.
drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, integer, integer);
drop function if exists public.admin_list_businesses_v2(text, text, text, text, text, text, integer, integer);

create or replace function public.admin_list_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text,
  risk_filter text,
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
  highest_review_risk text,
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
    public.business_highest_review_risk(b.id) as highest_review_risk,
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
    and (
      risk_filter is null
      or length(trim(risk_filter)) = 0
      or exists (
        select 1
        from public.reviews r
        where r.business_id = b.id
          and lower(trim(coalesce(r.risk_status, ''))) = lower(trim(risk_filter))
      )
    )
  order by b.created_at desc nulls last, b.id desc
  limit (select least(greatest(coalesce(limit_count, 50), 1), 1000))
  offset (select greatest(coalesce(offset_count, 0), 0));
$$;

comment on function public.admin_list_businesses_v2(text, text, text, text, text, text, text, integer, integer) is
  'Admin: paginated businesses; risk_filter = low | medium | high.';

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, text, text, integer, integer)
  to authenticated;

drop function if exists public.admin_count_businesses_v2(text, text, text);
drop function if exists public.admin_count_businesses_v2(text, text, text, text, text);
drop function if exists public.admin_count_businesses_v2(text, text, text, text, text, text);

create or replace function public.admin_count_businesses_v2(
  search_term text,
  status_filter text,
  submission_filter text,
  country_filter text,
  category_filter text,
  admin_action_filter text,
  risk_filter text
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
    )
    and (
      risk_filter is null
      or length(trim(risk_filter)) = 0
      or exists (
        select 1
        from public.reviews r
        where r.business_id = b.id
          and lower(trim(coalesce(r.risk_status, ''))) = lower(trim(risk_filter))
      )
    );
$$;

comment on function public.admin_count_businesses_v2(text, text, text, text, text, text, text) is
  'Admin: total count for admin_list_businesses_v2 with same filters including risk.';

grant execute on function public.admin_count_businesses_v2(text, text, text, text, text, text, text) to authenticated;

-- Business insights: highest review risk per business.
-- DROP required: production view may expose `id` (not `business_id`); CREATE OR REPLACE
-- cannot rename view columns (PostgreSQL 42P16).
drop view if exists public.admin_business_insights;

create view public.admin_business_insights as
select
  b.id as id,
  coalesce(b.name, '')::text as name,
  coalesce(lower(trim(b.plan)), 'free')::text as plan,
  coalesce(b.country_code, '')::text as country_code,
  coalesce(inv.cnt, 0)::bigint as total_invites,
  coalesce(rev.cnt, 0)::bigint as total_reviews,
  inv.last_invite as last_invite,
  rev.last_review as last_review,
  case
    when inv.last_invite is null and rev.last_review is null then null
    else greatest(inv.last_invite, rev.last_review)
  end as last_activity,
  public.business_highest_review_risk(b.id) as highest_review_risk
from public.businesses b
left join (
  select
    business_id,
    count(*)::bigint as cnt,
    max(created_at) as last_invite
  from public.review_invites
  group by business_id
) inv on inv.business_id = b.id
left join (
  select
    business_id,
    count(*)::bigint as cnt,
    max(created_at) as last_review
  from public.reviews
  where (status is null or status = 'published')
  group by business_id
) rev on rev.business_id = b.id;

comment on view public.admin_business_insights is
  'Admin: per-business invites, reviews, activity, and highest review risk.';

grant select on public.admin_business_insights to authenticated;
grant select on public.admin_business_insights to service_role;

-- Admin review list: include risk fields.
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
  reviewer_email text,
  rating numeric,
  title text,
  body text,
  body_preview text,
  verification_status text,
  status text,
  visibility text,
  is_flagged boolean,
  risk_score smallint,
  risk_status text,
  moderation_reason text,
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
    coalesce(
      nullif(trim(r.author_email), ''),
      nullif(trim(r.guest_email), ''),
      nullif(trim(r.email), ''),
      nullif(trim(u.email::text), '')
    ) as reviewer_email,
    r.rating,
    r.title::text,
    r.body::text,
    left(coalesce(r.body, ''), 200)::text,
    case when r.verified_at is not null then 'verified' else 'unverified' end::text,
    r.status::text,
    r.visibility::text,
    r.is_flagged,
    r.risk_score,
    r.risk_status::text,
    r.moderation_reason::text,
    r.created_at
  from public.reviews r
  join public.businesses b on b.id = r.business_id
  left join auth.users u on u.id = r.user_id
  where public.is_current_user_admin()
    and (
      search_term is null
      or trim(search_term) = ''
      or b.name ilike '%' || trim(search_term) || '%'
      or coalesce(r.title, '') ilike '%' || trim(search_term) || '%'
      or coalesce(r.body, '') ilike '%' || trim(search_term) || '%'
      or coalesce(r.guest_email, '') ilike '%' || trim(search_term) || '%'
      or coalesce(u.email::text, '') ilike '%' || trim(search_term) || '%'
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
      or (lower(trim(moderation_filter)) = 'flagged' and r.is_flagged = true)
    )
  order by r.created_at desc
  limit least(greatest(coalesce(nullif(limit_count, 0), 50), 1), 500)
  offset greatest(0, coalesce(offset_count, 0));
$$;

comment on function public.admin_list_reviews(text, text, integer, integer, text) is
  'Admin-only review list with risk fields; moderation_filter all | unverified | flagged.';

grant execute on function public.admin_list_reviews(text, text, integer, integer, text) to authenticated;
