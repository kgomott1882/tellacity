-- Align OTP code comparison with how codes are stored (text or integer) via ::text.
create or replace function public.verify_review_token(p_token uuid, p_code text)
returns table (
  success boolean,
  reason text,
  business_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_otp record;
  v_deadline timestamptz;
  v_draft record;
  v_business_id uuid;
  v_guest_name text;
begin
  if p_code is null or trim(p_code) = '' then
    return query select false, 'invalid_code'::text, null::uuid;
    return;
  end if;

  select * into v_otp
  from public.review_otps
  where draft_id = p_token
    and trim(coalesce(code::text, '')) = trim(p_code)
  order by created_at desc
  limit 1;

  if v_otp is null then
    return query select false, 'invalid_code'::text, null::uuid;
    return;
  end if;

  v_deadline := coalesce(
    v_otp.expires_at,
    v_otp.created_at + interval '10 minutes'
  );
  if v_deadline < now() then
    return query select false, 'expired'::text, null::uuid;
    return;
  end if;

  select * into v_draft
  from public.review_drafts
  where id = p_token;

  if v_draft is null then
    return query select false, 'draft_not_found'::text, null::uuid;
    return;
  end if;

  v_guest_name := coalesce(
    nullif(trim(coalesce(v_draft.guest_name, '')), ''),
    nullif(trim(split_part(v_draft.email::text, '@', 1)), ''),
    'Customer'
  );

  insert into public.reviews (
    business_id,
    rating,
    title,
    body,
    guest_email,
    guest_name,
    invite_id,
    status,
    verification_status,
    draft,
    imported,
    marketing_opt_in,
    visibility,
    date_of_experience,
    receipt_url,
    reference_number,
    user_id
  )
  values (
    v_draft.business_id,
    v_draft.rating,
    v_draft.title,
    v_draft.body,
    v_draft.email,
    v_guest_name,
    v_draft.invite_id,
    'published',
    'pending',
    false,
    false,
    coalesce(v_draft.marketing_opt_in, false),
    'visible',
    v_draft.date_of_experience,
    v_draft.receipt_url,
    v_draft.reference_number,
    v_draft.user_id
  )
  returning public.reviews.business_id into v_business_id;

  if v_business_id is null then
    return query select false, 'insert_failed'::text, null::uuid;
    return;
  end if;

  if v_draft.invite_id is not null then
    update public.review_invites
    set
      review_submitted_at = now(),
      status = 'completed'
    where id = v_draft.invite_id;
  end if;

  delete from public.review_drafts
  where id = p_token;

  return query select true, 'published'::text, v_business_id;
end;
$$;
