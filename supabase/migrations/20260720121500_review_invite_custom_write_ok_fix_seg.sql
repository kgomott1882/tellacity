-- Fix: PL/pgSQL "SELECT ... INTO seg" was parsed so `seg` looked like a table (42P01 relation "seg" does not exist).
-- Replaces the helper with a pure SQL implementation. Safe if 20260720120000 already applied.

create or replace function public.review_invite_custom_template_write_ok(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select
    exists (
      select 1
      from public.businesses b
      where b.id = p_business_id
        and coalesce(public.review_invite_plan_first_segment(b.plan), 'free') <> 'free'
    )
    or exists (
      select 1
      from public.subscriptions s
      where s.business_id = p_business_id
        and lower(coalesce(s.status::text, '')) in ('active', 'trialing')
        and coalesce(public.review_invite_plan_first_segment(s.plan_code), 'free') <> 'free'
    );
$$;

comment on function public.review_invite_custom_template_write_ok(uuid) is
  'True when business has a non-free plan on businesses.plan or any active/trialing subscription (matches dashboard plan merge).';

revoke all on function public.review_invite_custom_template_write_ok(uuid) from public;
grant execute on function public.review_invite_custom_template_write_ok(uuid) to authenticated;

grant select, insert, update, delete on table public.review_invite_email_templates to authenticated;

notify pgrst, 'reload schema';
