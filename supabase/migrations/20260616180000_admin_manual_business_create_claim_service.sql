-- Admin manual business create + claim (service role only).
-- Direct PostgREST writes on businesses/profiles can fail with
-- "permission denied for table users" when hosted triggers touch public.users.

create or replace function public.admin_upsert_owner_profile_service(
  p_user_id uuid,
  p_email text,
  p_owner_display_name text default null,
  p_business_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(nullif(trim(both from coalesce(p_email, '')), ''));
  v_name text := nullif(trim(both from coalesce(p_owner_display_name, '')), '');
  v_business_name text := nullif(trim(both from coalesce(p_business_name, '')), '');
begin
  if p_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_user_id');
  end if;

  insert into public.profiles (id, email, display_name)
  values (p_user_id, v_email, v_name)
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    display_name = coalesce(excluded.display_name, public.profiles.display_name);

  if v_business_name is not null then
    insert into public.business_profiles (id, email, business_name)
    values (p_user_id, v_email, v_business_name)
    on conflict (id) do update set
      email = coalesce(excluded.email, public.business_profiles.email),
      business_name = coalesce(excluded.business_name, public.business_profiles.business_name);
  end if;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

create or replace function public.admin_insert_business_manual_service(
  p_name text,
  p_slug text,
  p_website text,
  p_country_code text,
  p_category_slug text,
  p_primary_group_slug text,
  p_address text default null,
  p_city text default null,
  p_phone text default null,
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_slug text := nullif(trim(both from coalesce(p_slug, '')), '');
begin
  if v_slug is null then
    return jsonb_build_object('ok', false, 'error', 'missing_slug');
  end if;

  insert into public.businesses (
    name,
    slug,
    website,
    country_code,
    category_slug,
    primary_group_slug,
    address,
    city,
    phone,
    email,
    source,
    submission_status,
    status,
    owner_id,
    is_claimed
  )
  values (
    trim(p_name),
    v_slug,
    nullif(trim(both from coalesce(p_website, '')), ''),
    upper(left(trim(coalesce(p_country_code, '')), 2)),
    nullif(trim(both from coalesce(p_category_slug, '')), ''),
    nullif(trim(both from coalesce(p_primary_group_slug, '')), ''),
    nullif(trim(both from coalesce(p_address, '')), ''),
    nullif(trim(both from coalesce(p_city, '')), ''),
    nullif(trim(both from coalesce(p_phone, '')), ''),
    lower(nullif(trim(both from coalesce(p_email, '')), '')),
    'admin_manual',
    'approved',
    'active',
    null,
    false
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'business_id', v_id, 'slug', v_slug);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'duplicate_business');
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

create or replace function public.admin_claim_business_service(
  p_business_id uuid,
  p_owner_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing_owner uuid;
  v_linked_owner uuid;
  v_row_count int;
begin
  if p_business_id is null or p_owner_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_ids');
  end if;

  select b.owner_id into v_existing_owner
  from public.businesses b
  where b.id = p_business_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'business_not_found');
  end if;

  if v_existing_owner is not null and v_existing_owner <> p_owner_user_id then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  select bo.owner_user_id into v_linked_owner
  from public.business_owners bo
  where bo.business_id = p_business_id;

  if v_linked_owner is not null and v_linked_owner <> p_owner_user_id then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  update public.businesses
  set
    owner_id = p_owner_user_id,
    is_claimed = true,
    status = 'active',
    submission_status = 'approved'
  where id = p_business_id;

  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'claim_update_failed');
  end if;

  insert into public.business_owners (business_id, owner_user_id)
  values (p_business_id, p_owner_user_id)
  on conflict (business_id) do update
    set owner_user_id = excluded.owner_user_id;

  return jsonb_build_object('ok', true);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

comment on function public.admin_upsert_owner_profile_service(uuid, text, text, text) is
  'Service-role: ensure profiles + business_profiles shell for admin manual claim.';
comment on function public.admin_insert_business_manual_service(text, text, text, text, text, text, text, text, text, text) is
  'Service-role: insert active admin_manual business without owner.';
comment on function public.admin_claim_business_service(uuid, uuid) is
  'Service-role: assign owner_id + business_owners without domain OTP.';

revoke all on function public.admin_upsert_owner_profile_service(uuid, text, text, text) from public;
revoke all on function public.admin_insert_business_manual_service(text, text, text, text, text, text, text, text, text, text) from public;
revoke all on function public.admin_claim_business_service(uuid, uuid) from public;

grant execute on function public.admin_upsert_owner_profile_service(uuid, text, text, text) to service_role;
grant execute on function public.admin_insert_business_manual_service(text, text, text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.admin_claim_business_service(uuid, uuid) to service_role;

notify pgrst, 'reload schema';
