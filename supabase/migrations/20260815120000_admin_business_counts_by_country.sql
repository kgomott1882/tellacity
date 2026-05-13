-- Admin: live aggregate of active businesses (and published/live reviews) grouped by country.
-- Used by /admin/categories top panel so admins can see geographic coverage at a glance.

drop function if exists public.admin_business_counts_by_country();

create function public.admin_business_counts_by_country()
returns table (
  country_code text,
  business_count bigint,
  review_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  return query
  with active_businesses as (
    select
      b.id,
      nullif(upper(trim(coalesce(b.country_code, ''))), '') as country_code
    from public.businesses b
    where coalesce(b.status, 'active') = 'active'
  ),
  business_counts as (
    select
      ab.country_code,
      count(*)::bigint as business_count
    from active_businesses ab
    group by ab.country_code
  ),
  review_counts as (
    select
      ab.country_code,
      count(distinct r.id)::bigint as review_count
    from public.reviews r
    inner join active_businesses ab on ab.id = r.business_id
    where coalesce(r.status, 'published') in ('published', 'live')
    group by ab.country_code
  )
  select
    coalesce(bc.country_code, '')::text as country_code,
    coalesce(bc.business_count, 0)::bigint as business_count,
    coalesce(rc.review_count, 0)::bigint as review_count
  from business_counts bc
  left join review_counts rc on rc.country_code is not distinct from bc.country_code
  order by coalesce(bc.business_count, 0) desc,
    coalesce(bc.country_code, '') asc;
end;
$$;

comment on function public.admin_business_counts_by_country() is
  'Admin: live business + published/live review totals grouped by country_code for active businesses.';

grant execute on function public.admin_business_counts_by_country() to authenticated;

notify pgrst, 'reload schema';
