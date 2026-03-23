-- Admin: update business status / submission_status (used by dashboard + admin UI).

alter table public.businesses add column if not exists updated_at timestamptz;

drop function if exists public.admin_update_business_status(text, text, uuid);

create or replace function public.admin_update_business_status(
  new_status text,
  new_submission_status text,
  target_business_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  update public.businesses
  set
    status = coalesce(new_status, status),
    submission_status = coalesce(new_submission_status, submission_status),
    updated_at = now()
  where id = target_business_id;
end;
$$;

comment on function public.admin_update_business_status(text, text, uuid) is
  'Admin: set status and/or submission_status; null args leave that column unchanged.';

grant execute on function public.admin_update_business_status(text, text, uuid) to authenticated;
