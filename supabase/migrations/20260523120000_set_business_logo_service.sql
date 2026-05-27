-- Logo backfill script updates businesses.logo_url via service role.
-- Direct PostgREST updates can fail with "permission denied for table users"
-- when hosted DB triggers touch public.users. SECURITY DEFINER avoids that.

create or replace function public.set_business_logo_from_service(
  p_business_id uuid,
  p_logo_url text,
  p_logo_fetched_at timestamptz default now(),
  p_logo_fetch_failed boolean default false
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_business_id is null then
    return false;
  end if;

  update public.businesses
  set
    logo_url = case
      when p_logo_url is not null then nullif(trim(p_logo_url), '')
      else logo_url
    end,
    logo_fetched_at = coalesce(p_logo_fetched_at, now()),
    logo_fetch_failed = coalesce(p_logo_fetch_failed, false)
  where id = p_business_id;

  return found;
end;
$$;

comment on function public.set_business_logo_from_service(uuid, text, timestamptz, boolean) is
  'Service-role logo pipeline: persist Supabase Storage (or other) logo URL on businesses.';

revoke all on function public.set_business_logo_from_service(uuid, text, timestamptz, boolean) from public;
grant execute on function public.set_business_logo_from_service(uuid, text, timestamptz, boolean) to service_role;
