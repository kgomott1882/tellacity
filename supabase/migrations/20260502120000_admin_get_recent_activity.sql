-- Unified recent activity for admin overview (includes email for every row type).

create table if not exists public.business_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  business_name text,
  created_at timestamptz not null default now()
);

create or replace function public.admin_get_recent_activity(limit_count integer default 40)
returns table (
  item_type text,
  item_id text,
  title text,
  subtitle text,
  email text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int;
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and coalesce(p.is_admin, false) = true
  ) then
    raise exception 'not authorized';
  end if;

  lim := greatest(1, least(coalesce(limit_count, 40), 200));

  return query
  select *
  from (
    (
      select
        'review'::text,
        r.id::text,
        'Review created'::text,
        coalesce(b.name::text, '—'::text),
        nullif(
          trim(
            both from coalesce(
              r.email,
              r.author_email,
              r.guest_email,
              pr.email,
              ''::text
            )
          ),
          ''::text
        ),
        r.created_at
      from public.reviews r
      left join public.businesses b on b.id = r.business_id
      left join public.profiles pr on pr.id = r.consumer_id
      order by r.created_at desc
      limit lim
    )
    union all
    (
      select
        'new_user'::text,
        p.id::text,
        'New user'::text,
        coalesce(
          nullif(trim(both from bp.business_name::text), ''),
          nullif(trim(both from au.raw_user_meta_data->>'signup_company_name'), ''),
          '—'::text
        ),
        nullif(trim(both from coalesce(p.email::text, '')), ''),
        p.created_at
      from public.profiles p
      left join public.business_profiles bp on bp.id = p.id
      left join auth.users au on au.id = p.id
      order by p.created_at desc
      limit lim
    )
    union all
    (
      select
        'business_created'::text,
        b.id::text,
        'Business created'::text,
        coalesce(b.name::text, '—'::text),
        nullif(
          trim(
            both from             coalesce(
              au.email::text,
              b.email::text,
              ''::text
            )
          ),
          ''::text
        ),
        b.created_at
      from public.businesses b
      left join auth.users au on au.id = b.owner_id
      order by b.created_at desc
      limit lim
    )
  ) as u(item_type, item_id, title, subtitle, email, created_at)
  order by u.created_at desc
  limit lim;
end;
$$;

comment on function public.admin_get_recent_activity(integer) is
  'Admin overview feed: reviews, new users, businesses with actor/listing email. Requires profiles.is_admin.';

grant execute on function public.admin_get_recent_activity(integer) to authenticated;

notify pgrst, 'reload schema';
