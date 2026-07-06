-- Owner self-service account + owned business listing deletion (service role API).
-- Also defines admin_delete_business used by the admin dashboard.

create or replace function public.delete_business_row_service(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_business_id is null then
    raise exception 'missing_business_id';
  end if;

  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    raise exception 'business_not_found';
  end if;

  -- Reviews may predate ON DELETE CASCADE from businesses.
  delete from public.reviews where business_id = p_business_id;

  delete from public.businesses where id = p_business_id;
end;
$$;

comment on function public.delete_business_row_service(uuid) is
  'Service-role: hard-delete a business row and its public reviews.';

drop function if exists public.admin_delete_business(uuid);

create or replace function public.admin_delete_business(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin access required';
  end if;

  perform public.delete_business_row_service(target_business_id);
end;
$$;

comment on function public.admin_delete_business(uuid) is
  'Admin: permanently delete a business listing and its reviews.';

grant execute on function public.admin_delete_business(uuid) to authenticated;

create or replace function public.owner_delete_business_account_service(p_owner_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_biz_id uuid;
  v_deleted uuid[] := array[]::uuid[];
begin
  if p_owner_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_user_id');
  end if;

  for v_biz_id in
    select distinct owned.business_id
    from (
      select b.id as business_id
      from public.businesses b
      where b.owner_id = p_owner_user_id
      union
      select bo.business_id
      from public.business_owners bo
      where bo.owner_user_id = p_owner_user_id
    ) as owned
  loop
    perform public.delete_business_row_service(v_biz_id);
    v_deleted := array_append(v_deleted, v_biz_id);
  end loop;

  delete from public.business_members where user_id = p_owner_user_id;
  delete from public.business_profiles where id = p_owner_user_id;
  delete from public.profiles where id = p_owner_user_id;

  return jsonb_build_object(
    'ok', true,
    'deleted_business_ids', to_jsonb(v_deleted)
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

comment on function public.owner_delete_business_account_service(uuid) is
  'Service-role: delete businesses owned by user, then profile shells (auth user deleted in API).';

revoke all on function public.delete_business_row_service(uuid) from public;
revoke all on function public.owner_delete_business_account_service(uuid) from public;

grant execute on function public.delete_business_row_service(uuid) to service_role;
grant execute on function public.owner_delete_business_account_service(uuid) to service_role;

notify pgrst, 'reload schema';
