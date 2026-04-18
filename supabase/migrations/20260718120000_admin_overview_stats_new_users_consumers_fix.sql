-- Admin overview stats: align "New users today" and "Consumer users" with real product activity.
--
-- Problems addressed:
-- - Guest reviews create activity + new public emails without creating auth.users rows, so
--   counting only auth.users undercounts "new users today" vs review volume.
-- - Many profiles shells insert with role NULL; counting only role='consumer' undercounts consumers.
--
-- New definitions:
-- - new_users_today: DISTINCT identities among
--     (A) auth.users created on current UTC day, OR
--     (B) first-time reviewer emails from reviews created on current UTC day
--         where the normalized email was not present in reviews before that UTC day start
--         AND is not already present in auth.users (any time)
--   Identity key is lower(trim(email)) for both groups.
-- - consumer_users: profiles that are not business-role shells, excluding tellacity placeholder emails.

drop function if exists public.admin_get_overview_stats();

create or replace function public.admin_get_overview_stats()
returns table (
  total_users bigint,
  total_businesses bigint,
  total_reviews bigint,
  new_users_today bigint,
  reviews_today bigint,
  pending_businesses bigint,
  business_users bigint,
  consumer_users bigint
)
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
  utc_today date := (now() at time zone 'utc')::date;
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with
  reviewer_email as (
    select
      r.id as review_id,
      r.created_at,
      nullif(
        lower(
          trim(
            both from coalesce(
              nullif(trim(both from coalesce(r.email::text, '')), ''),
              nullif(trim(both from coalesce(r.author_email::text, '')), ''),
              nullif(trim(both from coalesce(r.guest_email::text, '')), '')
            )
          )
        ),
        ''
      ) as email
    from public.reviews r
  ),
  first_time_today as (
    select distinct e.email
    from reviewer_email e
    where e.email is not null
      and e.email not like '%@tellacity.auth'
      and (e.created_at at time zone 'utc')::date = utc_today
      and not exists (
        select 1
        from reviewer_email p
        where p.email = e.email
          and (p.created_at at time zone 'utc')::date < utc_today
      )
      and not exists (
        select 1
        from auth.users u
        where nullif(lower(trim(both from u.email::text)), '') = e.email
      )
  ),
  new_auth_today as (
    select distinct nullif(lower(trim(both from u.email::text)), '') as email
    from auth.users u
    where (u.created_at at time zone 'utc')::date = utc_today
      and nullif(lower(trim(both from u.email::text)), '') is not null
      and lower(trim(both from u.email::text)) not like '%@tellacity.auth'
  ),
  new_users_union as (
    select email from new_auth_today
    union
    select email from first_time_today
  )
  select
    (select count(*)::bigint from auth.users) as total_users,
    (select count(*)::bigint from public.businesses) as total_businesses,
    (select count(*)::bigint from public.reviews) as total_reviews,
    (select count(*)::bigint from new_users_union) as new_users_today,
    (
      select count(*)::bigint
      from public.reviews r
      where (r.created_at at time zone 'utc')::date = utc_today
    ) as reviews_today,
    (
      select count(*)::bigint
      from public.businesses b
      where
        lower(trim(coalesce(b.submission_status, ''))) in (
          'pending',
          'submitted',
          'under_review'
        )
        or b.status = 'under_review'::public.business_status_enum
    ) as pending_businesses,
    (
      select count(*)::bigint
      from public.profiles p
      where lower(trim(coalesce(p.role, ''))) = 'business'
    ) as business_users,
    (
      select count(*)::bigint
      from public.profiles p
      where coalesce(p.is_admin, false) is distinct from true
        and lower(trim(coalesce(p.role, ''))) <> 'business'
        and coalesce(nullif(lower(trim(both from p.email::text)), ''), '') not like '%@tellacity.auth'
    ) as consumer_users;
end;
$function$;

comment on function public.admin_get_overview_stats() is
  'Admin dashboard aggregates. new_users_today: new auth emails today + first-time reviewer emails today (UTC) not previously seen in reviews and not already in auth.users; consumer_users: non-business profiles excluding admins + tellacity placeholder emails.';

grant execute on function public.admin_get_overview_stats() to authenticated;

notify pgrst, 'reload schema';
