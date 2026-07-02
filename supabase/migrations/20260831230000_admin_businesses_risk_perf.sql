-- Fix admin businesses list timeout: avoid per-row business_highest_review_risk() calls.

create index if not exists reviews_business_id_risk_status_idx
  on public.reviews (business_id, risk_status)
  where risk_status is not null and trim(risk_status) <> '';

create index if not exists reviews_business_id_lower_risk_status_idx
  on public.reviews (business_id, lower(risk_status))
  where risk_status is not null and trim(risk_status) <> '';

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
  with biz_highest_risk as (
    select distinct on (r.business_id)
      r.business_id,
      r.risk_status as highest_review_risk
    from public.reviews r
    where r.risk_status is not null
      and trim(r.risk_status) <> ''
    order by
      r.business_id,
      case lower(trim(r.risk_status))
        when 'high' then 3
        when 'medium' then 2
        when 'low' then 1
        else 0
      end desc,
      r.created_at desc
  )
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
    biz_risk.highest_review_risk,
    b.created_at
  from public.businesses b
  left join public.categories c on c.slug = b.category_slug
  left join biz_highest_risk biz_risk on biz_risk.business_id = b.id
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

grant execute on function public.admin_list_businesses_v2(text, text, text, text, text, text, text, integer, integer)
  to authenticated;

-- Business insights: join instead of per-row function.
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
  biz_risk.highest_review_risk
from public.businesses b
left join (
  select distinct on (r.business_id)
    r.business_id,
    r.risk_status as highest_review_risk
  from public.reviews r
  where r.risk_status is not null
    and trim(r.risk_status) <> ''
  order by
    r.business_id,
    case lower(trim(r.risk_status))
      when 'high' then 3
      when 'medium' then 2
      when 'low' then 1
      else 0
    end desc,
    r.created_at desc
) biz_risk on biz_risk.business_id = b.id
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

grant select on public.admin_business_insights to authenticated;
grant select on public.admin_business_insights to service_role;

notify pgrst, 'reload schema';
