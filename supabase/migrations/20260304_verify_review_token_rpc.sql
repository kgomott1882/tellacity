-- RPC function to verify guest review tokens atomically.
-- This function:
-- - validates the magic token in consumer_otps
-- - checks expiry and used_at
-- - publishes the associated pending review
-- - marks the token as used
-- - returns business_id for redirect

create or replace function public.verify_review_token(p_token uuid)
returns table(
  success boolean,
  reason text,
  business_id uuid
)
language plpgsql
security definer
as $$
declare
  v_review_id uuid;
  v_business_id uuid;
  v_expires timestamptz;
  v_used timestamptz;
begin

  -- lookup token
  select review_id, expires_at, used_at
  into v_review_id, v_expires, v_used
  from consumer_otps
  where magic_token = p_token;

  if v_review_id is null then
    return query select false, 'invalid', null::uuid;
    return;
  end if;

  if v_used is not null then
    select business_id into v_business_id
    from reviews
    where id = v_review_id;

    return query select true, 'already_published', v_business_id;
    return;
  end if;

  if v_expires < now() then
    return query select false, 'expired', null::uuid;
    return;
  end if;

  -- publish review (only if still pending)
  update reviews
  set status = 'published',
      verified_at = now()
  where id = v_review_id
    and status = 'pending'
  returning business_id into v_business_id;

  if v_business_id is null then
    return query select false, 'review_not_pending', null::uuid;
    return;
  end if;

  -- mark token used
  update consumer_otps
  set used_at = now()
  where magic_token = p_token;

  return query select true, 'published', v_business_id;

end;
$$;

grant execute on function public.verify_review_token(uuid) to anon;

