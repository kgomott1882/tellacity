-- Admin Plan Control: upsert active subscription when changing plan (no row required).
-- Replaces RPC behavior that failed with "No active subscription found for business …".

create or replace function public.admin_update_business_plan(
  p_business_id uuid,
  p_plan_code text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan text;
  v_old_plan text;
  v_updated int;
begin
  if not public.is_current_user_admin() then
    raise exception 'Admin only';
  end if;

  if p_business_id is null then
    raise exception 'business_id required';
  end if;

  v_plan := lower(trim(coalesce(p_plan_code, '')));
  if v_plan not in ('free', 'grow', 'premium', 'elite') then
    raise exception 'Invalid plan code';
  end if;

  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    raise exception 'Business not found';
  end if;

  select coalesce(
    (
      select s.plan_code
      from public.subscriptions s
      where s.business_id = p_business_id
        and s.status in ('active', 'trialing', 'past_due', 'pending')
      order by s.updated_at desc nulls last
      limit 1
    ),
    'free'
  )
  into v_old_plan;

  update public.subscriptions
  set
    plan_code = v_plan,
    status = 'active',
    provider = coalesce(nullif(trim(provider), ''), 'admin'),
    provider_sub_id = coalesce(nullif(trim(provider_sub_id), ''), 'admin:' || p_business_id::text),
    pending_plan_code = null,
    pending_change_at = null,
    current_period_end = null,
    updated_at = now()
  where business_id = p_business_id;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    insert into public.subscriptions (
      business_id,
      plan_code,
      status,
      provider,
      provider_sub_id,
      updated_at
    )
    values (
      p_business_id,
      v_plan,
      'active',
      'admin',
      'admin:' || p_business_id::text,
      now()
    );
  end if;

  update public.businesses
  set plan = v_plan
  where id = p_business_id;

  insert into public.subscription_changes (business_id, old_plan, new_plan)
  values (p_business_id, v_old_plan, v_plan);
end;
$$;

comment on function public.admin_update_business_plan(uuid, text) is
  'Admin: set plan on subscriptions (insert active row if missing) and sync businesses.plan.';

revoke all on function public.admin_update_business_plan(uuid, text) from public;
grant execute on function public.admin_update_business_plan(uuid, text) to authenticated;

notify pgrst, 'reload schema';
