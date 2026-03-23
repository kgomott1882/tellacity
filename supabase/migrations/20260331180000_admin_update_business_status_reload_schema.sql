-- PostgREST schema cache: drop/recreate strict signature, re-grant, force reload.
-- Fixes "Could not find function ... in schema cache" after RPC changes.

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

-- Critical: tell PostgREST to reload schema (same as Dashboard "Reload schema").
notify pgrst, 'reload schema';

-- Verify (run in SQL editor if needed):
-- select routine_name
-- from information_schema.routines
-- where routine_schema = 'public' and routine_name = 'admin_update_business_status';
