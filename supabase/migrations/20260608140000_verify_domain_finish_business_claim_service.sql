-- Server-only: same as verify_domain_finish_business_claim but takes p_user_id and uses
-- business_domain_verifications.email for domain checks (no JWT). Callable only by service_role
-- from Next.js so PostgREST direct UPDATE on businesses (and broken TS fallback) is not needed.

create or replace function public.verify_domain_finish_business_claim_service(
  p_business_id uuid,
  p_user_id uuid,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := p_user_id;
  v_email text;
  v_email_domain text;
  v_website text;
  v_status_raw text;
  v_status_lower text;
  v_host text;
  v_bo uuid;
  v_vid uuid;
  v_stored_code text;
  v_expires timestamptz;
  v_row_count int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  if p_code is null or p_code !~ '^\d{6}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  select b.website, b.status
  into v_website, v_status_raw
  from public.businesses b
  where b.id = p_business_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'business_not_found');
  end if;

  v_status_lower := lower(trim(both from coalesce(v_status_raw, '')));

  v_host := regexp_replace(
    regexp_replace(lower(coalesce(v_website, '')), '^https?://', '', 'gi'),
    '/.*$',
    ''
  );
  v_host := regexp_replace(v_host, '^www\.', '', 'i');

  if v_host is null or v_host = '' then
    return jsonb_build_object('ok', false, 'error', 'domain_mismatch');
  end if;

  select bo.owner_user_id into v_bo
  from public.business_owners bo
  where bo.business_id = p_business_id;

  if v_bo is not null and v_bo <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;

  select v.id, v.code, v.expires_at, v.email
  into v_vid, v_stored_code, v_expires, v_email
  from public.business_domain_verifications v
  where v.user_id = v_uid
    and v.business_id = p_business_id
    and v.consumed_at is null
  order by v.created_at desc
  limit 1;

  if v_vid is null then
    return jsonb_build_object('ok', false, 'error', 'no_pending_code');
  end if;

  v_email := lower(nullif(trim(both from coalesce(v_email, '')), ''));
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  v_email_domain := lower(trim(both from split_part(v_email, '@', 2)));

  if v_email_domain is distinct from v_host
     and v_host not like '%.' || v_email_domain
     and v_email_domain not like '%.' || v_host
  then
    return jsonb_build_object('ok', false, 'error', 'domain_mismatch');
  end if;

  if v_expires is not null and v_expires < now() then
    return jsonb_build_object('ok', false, 'error', 'code_expired');
  end if;

  if v_stored_code is distinct from p_code then
    return jsonb_build_object('ok', false, 'error', 'wrong_code');
  end if;

  if v_bo is not null and v_bo = v_uid then
    update public.business_domain_verifications
    set consumed_at = now()
    where id = v_vid;
    return jsonb_build_object('ok', true, 'already_owner', true);
  end if;

  if v_status_lower = 'pending_verification' then
    update public.businesses
    set
      owner_id = v_uid,
      is_claimed = true,
      status = 'active',
      submission_status = 'approved'
    where id = p_business_id
      and status = 'pending_verification';
    get diagnostics v_row_count = row_count;
    if v_row_count = 0 then
      return jsonb_build_object('ok', false, 'error', 'business_update_failed');
    end if;
  elsif v_status_lower = 'active'
    or v_status_lower = ''
    or v_status_raw is null
  then
    update public.businesses
    set owner_id = v_uid, is_claimed = true
    where id = p_business_id
      and owner_id is null;
    get diagnostics v_row_count = row_count;
    if v_row_count = 0 then
      return jsonb_build_object('ok', false, 'error', 'business_update_failed');
    end if;
  else
    return jsonb_build_object('ok', false, 'error', 'unsupported_business_status');
  end if;

  insert into public.business_owners (business_id, owner_user_id)
  values (p_business_id, v_uid)
  on conflict (business_id) do nothing;

  update public.business_domain_verifications
  set consumed_at = now()
  where id = v_vid;

  return jsonb_build_object('ok', true);
end;
$$;

comment on function public.verify_domain_finish_business_claim_service(uuid, uuid, text) is
  'Domain OTP completion for API routes using service role only; uses verification email for domain match.';

revoke all on function public.verify_domain_finish_business_claim_service(uuid, uuid, text) from public;
grant execute on function public.verify_domain_finish_business_claim_service(uuid, uuid, text) to service_role;

notify pgrst, 'reload schema';
