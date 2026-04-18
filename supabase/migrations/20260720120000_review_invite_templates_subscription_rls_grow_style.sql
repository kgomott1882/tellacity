-- 1) Grow-tier message styling (fonts / colours / bold) on custom invite templates.
-- 2) Fix RLS: custom template writes must respect subscription-backed plans, not only
--    businesses.plan (dashboard merges subscriptions → Grow while businesses.plan can stay "free").

alter table public.review_invite_email_templates
  add column if not exists grow_message_style jsonb null;

comment on column public.review_invite_email_templates.grow_message_style is
  'Optional JSON: subjectFont, subjectColor, subjectBold, bodyFont, bodyColor, bodyBold (sanitised in app).';

-- Normalise plan_code / businesses.plan like app normalizePlanCodeToKey first segment.
create or replace function public.review_invite_plan_first_segment(p_raw text)
returns text
language sql
immutable
as $$
  select nullif(
    split_part(
      case
        when position('business_' in lower(trim(coalesce(p_raw, '')))) = 1
          then substring(lower(trim(coalesce(p_raw, ''))) from 10)
        else lower(trim(coalesce(p_raw, '')))
      end,
      '_',
      1
    ),
    ''
  );
$$;

-- Pure SQL (no PL/pgSQL "INTO seg"): some Postgres parsers treat bare `seg` after INTO as a relation name.
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
  'True when business has a non-free plan on businesses.plan or any active/trialing subscription. SET row_security=off so reads on subscriptions (RLS) succeed inside this SECURITY DEFINER helper.';

revoke all on function public.review_invite_plan_first_segment(text) from public;
revoke all on function public.review_invite_custom_template_write_ok(uuid) from public;
grant execute on function public.review_invite_plan_first_segment(text) to authenticated;
grant execute on function public.review_invite_custom_template_write_ok(uuid) to authenticated;

-- Replace all policies so this migration is safe after partial applies or legacy FOR ALL only.
drop policy if exists "Business owners can manage review_email_templates"
  on public.review_invite_email_templates;
drop policy if exists "review_invite_email_templates_select" on public.review_invite_email_templates;
drop policy if exists "review_invite_email_templates_insert" on public.review_invite_email_templates;
drop policy if exists "review_invite_email_templates_update" on public.review_invite_email_templates;
drop policy if exists "review_invite_email_templates_delete" on public.review_invite_email_templates;

create policy "review_invite_email_templates_select"
  on public.review_invite_email_templates
  for select
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_owners bo
      where bo.business_id = business_id
        and bo.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

create policy "review_invite_email_templates_insert"
  on public.review_invite_email_templates
  for insert
  with check (
    (
      exists (
        select 1
        from public.businesses b
        where b.id = business_id
          and b.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.business_owners bo
        where bo.business_id = business_id
          and bo.owner_user_id = auth.uid()
      )
      or exists (
        select 1
        from public.business_members bm
        where bm.business_id = business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
      )
    )
    and (
      template_key is distinct from 'custom'
      or public.review_invite_custom_template_write_ok(business_id)
    )
  );

create policy "review_invite_email_templates_update"
  on public.review_invite_email_templates
  for update
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_owners bo
      where bo.business_id = business_id
        and bo.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  )
  with check (
    (
      exists (
        select 1
        from public.businesses b
        where b.id = business_id
          and b.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.business_owners bo
        where bo.business_id = business_id
          and bo.owner_user_id = auth.uid()
      )
      or exists (
        select 1
        from public.business_members bm
        where bm.business_id = business_id
          and bm.user_id = auth.uid()
          and bm.status = 'active'
      )
    )
    and (
      template_key is distinct from 'custom'
      or public.review_invite_custom_template_write_ok(business_id)
    )
  );

comment on policy "review_invite_email_templates_insert" on public.review_invite_email_templates is
  'Members can insert; custom rows require non-free plan via businesses.plan or active/trialing subscriptions.';

comment on policy "review_invite_email_templates_update" on public.review_invite_email_templates is
  'Members can update; custom rows require non-free plan via businesses.plan or active/trialing subscriptions.';

create policy "review_invite_email_templates_delete"
  on public.review_invite_email_templates
  for delete
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_id
        and b.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_owners bo
      where bo.business_id = business_id
        and bo.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

-- Table privileges (idempotent if already granted).
grant select, insert, update, delete on table public.review_invite_email_templates to authenticated;

notify pgrst, 'reload schema';
