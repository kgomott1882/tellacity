-- Admin: top N customer businesses ranked by their most recent meaningful activity.
-- "Activity" is the MAX timestamp across:
--   * business.created_at        -> classified as 'signup'
--   * latest published review    -> classified as 'review'
--   * latest dashboard login     -> classified as 'dashboard_login'
--   * latest other dashboard action -> classified as 'dashboard'
--
-- Returned rows include the activity timestamp, the classified kind, and lightweight
-- business + owner metadata so the admin UI can render rich cards.

drop function if exists public.admin_top_recent_business_activity(int);

create function public.admin_top_recent_business_activity(p_limit int default 15)
returns table (
  business_id uuid,
  business_name text,
  business_slug text,
  business_website text,
  business_logo_url text,
  business_status text,
  business_country_code text,
  business_created_at timestamptz,
  owner_id uuid,
  owner_email text,
  owner_display_name text,
  last_activity_at timestamptz,
  last_activity_kind text,
  last_review_at timestamptz,
  last_review_rating int,
  last_login_at timestamptz,
  last_dashboard_at timestamptz,
  last_dashboard_action text
)
language plpgsql
stable
security definer
set search_path = public, auth
as $function$
declare
  v_limit int := greatest(1, least(coalesce(p_limit, 15), 100));
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with eligible as (
    select
      b.id,
      b.name,
      b.slug,
      b.website,
      b.logo_url,
      b.status,
      b.country_code,
      b.owner_id,
      b.created_at
    from public.businesses b
    where b.owner_id is not null
  ),
  latest_review as (
    select distinct on (r.business_id)
      r.business_id,
      r.created_at as last_at,
      r.rating
    from public.reviews r
    where r.status = 'published'
      and coalesce(r.visibility, 'visible') = 'visible'
    order by r.business_id, r.created_at desc
  ),
  latest_login as (
    select
      bal.business_id,
      max(bal.created_at) as last_at
    from public.business_activity_logs bal
    where bal.action_type = 'dashboard_login'
    group by bal.business_id
  ),
  latest_dashboard as (
    select distinct on (bal.business_id)
      bal.business_id,
      bal.created_at as last_at,
      bal.action_type
    from public.business_activity_logs bal
    where bal.action_type in (
      'dashboard_login',
      'analytics_viewed',
      'reviews_viewed',
      'invitations_viewed',
      'widgets_viewed',
      'integrations_viewed',
      'billing_viewed',
      'settings_viewed',
      'widget_generated',
      'feature_locked_clicked',
      'profile_link_copied',
      'integration_connected',
      'mark_one_read',
      'mark_all_read',
      'review_replied',
      'invite_sent'
    )
    order by bal.business_id, bal.created_at desc
  ),
  combined as (
    select
      e.*,
      lr.last_at as last_review_at,
      lr.rating  as last_review_rating,
      ll.last_at as last_login_at,
      ld.last_at as last_dashboard_at,
      ld.action_type as last_dashboard_action
    from eligible e
    left join latest_review lr   on lr.business_id = e.id
    left join latest_login ll    on ll.business_id = e.id
    left join latest_dashboard ld on ld.business_id = e.id
  ),
  scored as (
    select
      c.*,
      greatest(
        coalesce(c.created_at,        'epoch'::timestamptz),
        coalesce(c.last_review_at,    'epoch'::timestamptz),
        coalesce(c.last_login_at,     'epoch'::timestamptz),
        coalesce(c.last_dashboard_at, 'epoch'::timestamptz)
      ) as last_activity_at_calc
    from combined c
  )
  select
    s.id::uuid                                        as business_id,
    coalesce(nullif(trim(s.name), ''),   '—')::text   as business_name,
    coalesce(s.slug, '')::text                        as business_slug,
    coalesce(s.website, '')::text                     as business_website,
    coalesce(s.logo_url, '')::text                    as business_logo_url,
    coalesce(s.status, 'active')::text                as business_status,
    coalesce(s.country_code, '')::text                as business_country_code,
    s.created_at                                      as business_created_at,
    s.owner_id::uuid                                  as owner_id,
    coalesce(
      nullif(lower(trim(coalesce(p.email,  u.email::text))), ''),
      ''
    )::text                                           as owner_email,
    coalesce(
      nullif(trim(p.display_name), ''),
      nullif(trim(p.email), ''),
      nullif(trim(u.email::text), ''),
      ''
    )::text                                           as owner_display_name,
    s.last_activity_at_calc                           as last_activity_at,
    case
      when s.last_review_at is not null
        and s.last_review_at >= coalesce(s.last_login_at,     'epoch'::timestamptz)
        and s.last_review_at >= coalesce(s.last_dashboard_at, 'epoch'::timestamptz)
        and s.last_review_at >= coalesce(s.created_at,        'epoch'::timestamptz)
          then 'review'
      when s.last_login_at is not null
        and s.last_login_at >= coalesce(s.last_dashboard_at, 'epoch'::timestamptz)
        and s.last_login_at >= coalesce(s.created_at,        'epoch'::timestamptz)
          then 'dashboard_login'
      when s.last_dashboard_at is not null
        and s.last_dashboard_at >= coalesce(s.created_at,    'epoch'::timestamptz)
          then 'dashboard'
      else 'signup'
    end::text                                         as last_activity_kind,
    s.last_review_at,
    s.last_review_rating::int,
    s.last_login_at,
    s.last_dashboard_at,
    coalesce(s.last_dashboard_action, '')::text       as last_dashboard_action
  from scored s
  left join public.profiles p on p.id = s.owner_id
  left join auth.users u      on u.id = s.owner_id
  order by s.last_activity_at_calc desc nulls last,
           s.name asc
  limit v_limit;
end;
$function$;

comment on function public.admin_top_recent_business_activity(int) is
  'Admin: top N customer businesses ranked by most recent activity (signup, latest review, or latest dashboard action). Default N = 15.';

grant execute on function public.admin_top_recent_business_activity(int) to authenticated;

notify pgrst, 'reload schema';
