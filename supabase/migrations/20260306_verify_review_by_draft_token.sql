-- RPC to verify and publish a review by draft_token (create-review-draft flow).
-- Runs as SECURITY DEFINER so it can find/update the draft regardless of RLS or client role.

create or replace function public.verify_review_by_draft_token(p_token uuid)
returns table(
  success boolean,
  reason text,
  business_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_business_id uuid;
  v_expires timestamptz;
begin
  select id, reviews.business_id, draft_token_expires_at
  into v_id, v_business_id, v_expires
  from public.reviews
  where draft_token = p_token
    and status = 'draft'
    and draft = true
  limit 1;

  if v_id is null then
    return query select false, 'not_found'::text, null::uuid;
    return;
  end if;

  if v_expires is not null and v_expires < now() then
    return query select false, 'expired'::text, null::uuid;
    return;
  end if;

  update public.reviews
  set status = 'published',
      draft = false,
      verified_at = now(),
      draft_token = null,
      draft_token_expires_at = null
  where id = v_id
    and draft_token = p_token
    and status = 'draft'
    and draft = true;

  if not found then
    return query select false, 'update_failed'::text, null::uuid;
    return;
  end if;

  return query select true, 'published'::text, v_business_id;
end;
$$;

comment on function public.verify_review_by_draft_token(uuid) is
  'Verifies a guest review by draft_token (from create-review-draft), publishes it, and returns business_id for redirect.';

grant execute on function public.verify_review_by_draft_token(uuid) to anon;
grant execute on function public.verify_review_by_draft_token(uuid) to service_role;
