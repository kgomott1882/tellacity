-- Admin overview: treat non–webmail auth emails (e.g. admin@capitaldigitizing.com) as business users
-- alongside owner/member team IDs. Consumer bucket requires a known personal/webmail domain on auth.email.
-- Keep the webmail domain array in sync with `RAW_CONSUMER_DOMAINS` in `src/lib/consumerEmailDomains.ts`.

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
  consumer_users bigint,
  other_users bigint
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
  consumer_domains as (
    select unnest(ARRAY[
      'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.ca',
      'yahoo.com.au', 'yahoo.co.jp', 'hotmail.com', 'hotmail.co.uk', 'outlook.com', 'outlook.co.uk',
      'live.com', 'live.co.uk', 'msn.com', 'icloud.com', 'me.com', 'mac.com', 'aol.com',
      'protonmail.com', 'proton.me', 'pm.me', 'gmx.com', 'gmx.net', 'gmx.de', 'mail.com',
      'yandex.com', 'yandex.ru', 'fastmail.com', 'hey.com', 'tutanota.com', 'tutamail.com',
      'mailbox.org', '163.com', 'qq.com', '126.com', 'sina.com', 'naver.com', 'daum.net',
      'hanmail.net', 'bluewin.ch', 'web.de', 'online.de', 't-online.de', 'rocketmail.com',
      'ymail.com', 'bellsouth.net', 'comcast.net', 'verizon.net', 'att.net', 'sbcglobal.net',
      'cox.net', 'charter.net', 'earthlink.net', 'juno.com', 'btinternet.com', 'virginmedia.com',
      'orange.fr', 'wanadoo.fr', 'free.fr', 'laposte.net', 'libero.it', 'virgilio.it', 'alice.it',
      'tin.it', 'ziggo.nl', 'xs4all.nl', 'hetnet.nl', 'home.nl', 'telus.net', 'shaw.ca',
      'rogers.com', 'bell.net', 'videotron.ca', 'sky.com', 'talktalk.net', 'ntlworld.com',
      'blueyonder.co.uk'
    ]::text[]) as domain
  ),
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
  ),
  business_team_ids as (
    select distinct x.uid as id
    from (
      select owner_id as uid from public.businesses where owner_id is not null
      union
      select user_id as uid from public.business_members where user_id is not null
    ) x
  ),
  business_users_cte as (
    select u.id
    from auth.users u
    where exists (select 1 from business_team_ids b where b.id = u.id)
    union
    select u.id
    from auth.users u
    cross join lateral (
      select nullif(
        lower(trim(both from split_part(coalesce(u.email::text, ''), '@', 2))),
        ''
      ) as dom
    ) d
    where d.dom is not null
      and lower(trim(both from coalesce(u.email::text, ''))) not like '%@tellacity.auth'
      and not exists (select 1 from consumer_domains c where c.domain = d.dom)
  ),
  consumer_users_cte as (
    select u.id
    from auth.users u
    inner join public.profiles p on p.id = u.id
    cross join lateral (
      select nullif(
        lower(trim(both from split_part(coalesce(u.email::text, ''), '@', 2))),
        ''
      ) as dom
    ) d
    where not exists (select 1 from business_users_cte b where b.id = u.id)
      and coalesce(p.is_admin, false) is distinct from true
      and lower(trim(coalesce(p.role, ''))) <> 'business'
      and coalesce(nullif(lower(trim(both from p.email::text)), ''), '') not like '%@tellacity.auth'
      and d.dom is not null
      and exists (select 1 from consumer_domains c where c.domain = d.dom)
  ),
  totals as (
    select
      (select count(*)::bigint from auth.users) as total_users,
      (select count(*)::bigint from business_users_cte) as business_users,
      (select count(*)::bigint from consumer_users_cte) as consumer_users
  )
  select
    t.total_users,
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
    t.business_users,
    t.consumer_users,
    greatest(
      t.total_users - t.business_users - t.consumer_users,
      0::bigint
    ) as other_users
  from totals t;
end;
$function$;

comment on function public.admin_get_overview_stats() is
  'Admin dashboard aggregates. business_users: business team in auth OR auth email on non-webmail domain (not @tellacity.auth). consumer_users: not business bucket, profile rules, auth email domain in webmail list. other_users: remainder.';

grant execute on function public.admin_get_overview_stats() to authenticated;

notify pgrst, 'reload schema';
