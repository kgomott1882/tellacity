-- Admin drill-down list for "New users today" (matches admin_get_overview_stats.new_users_today).

drop function if exists public.admin_list_new_users_today();

create or replace function public.admin_list_new_users_today()
returns table (
  kind text,
  id uuid,
  email text,
  display_name text,
  role text,
  is_admin boolean,
  created_at timestamptz
)
language plpgsql
stable
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
    select
      e.review_id,
      e.email,
      e.created_at
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
    select
      u.id as user_id,
      nullif(lower(trim(both from u.email::text)), '') as email,
      u.created_at
    from auth.users u
    where (u.created_at at time zone 'utc')::date = utc_today
      and nullif(lower(trim(both from u.email::text)), '') is not null
      and lower(trim(both from u.email::text)) not like '%@tellacity.auth'
  ),
  auth_rows as (
    select
      'auth_signup'::text as kind,
      a.user_id as id,
      a.email as email,
      coalesce(nullif(trim(both from p.display_name::text), ''), nullif(trim(both from p.email::text), '')) as display_name,
      p.role::text as role,
      coalesce(p.is_admin, false) as is_admin,
      a.created_at
    from new_auth_today a
    left join public.profiles p on p.id = a.user_id
  ),
  first_review_rows as (
    select
      'first_review_email'::text as kind,
      f.review_id as id,
      f.email as email,
      'First-time reviewer (guest email)'::text as display_name,
      null::text as role,
      false::boolean as is_admin,
      f.created_at
    from first_time_today f
    where not exists (
      select 1 from new_auth_today a where a.email = f.email
    )
  )
  select * from auth_rows
  union all
  select * from first_review_rows
  order by created_at desc;
end;
$function$;

comment on function public.admin_list_new_users_today() is
  'Admin: rows behind new_users_today (auth signups today + first-time reviewer emails today).';

grant execute on function public.admin_list_new_users_today() to authenticated;

notify pgrst, 'reload schema';
