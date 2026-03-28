-- Signup: claim existing business row when email domain matches website (SECURITY DEFINER bypasses RLS).

alter table public.businesses
  add column if not exists is_claimed boolean not null default false;

create or replace function public.claim_business_for_signup(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_email_domain text;
  v_website text;
  v_status text;
  v_host text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  v_email := lower(nullif(trim(auth.jwt() ->> 'email'), ''));
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  v_email_domain := lower(trim(split_part(v_email, '@', 2)));

  select b.website, coalesce(b.status, '')
  into v_website, v_status
  from public.businesses b
  where b.id = p_business_id;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'business_not_found');
  end if;

  if lower(trim(v_status)) is distinct from 'active' then
    return jsonb_build_object('ok', false, 'error', 'not_active');
  end if;

  v_host := regexp_replace(
    regexp_replace(lower(coalesce(v_website, '')), '^https?://', '', 'gi'),
    '/.*$',
    ''
  );
  v_host := regexp_replace(v_host, '^www\.', '', 'i');

  if v_host is null or v_host = '' then
    return jsonb_build_object('ok', false, 'error', 'domain_mismatch');
  end if;

  if v_host <> v_email_domain and v_host not like ('%.' || v_email_domain) then
    return jsonb_build_object('ok', false, 'error', 'domain_mismatch');
  end if;

  update public.businesses
  set
    owner_id = v_uid,
    is_claimed = true
  where id = p_business_id;

  insert into public.business_owners (business_id, owner_user_id)
  values (p_business_id, v_uid)
  on conflict (business_id) do update
    set owner_user_id = excluded.owner_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.claim_business_for_signup(uuid) to authenticated;
