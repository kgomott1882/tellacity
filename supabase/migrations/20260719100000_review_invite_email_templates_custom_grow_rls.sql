-- Enforce plan gate for custom review-invite templates at the database layer.
-- UI already blocks saves for free plans; this prevents direct Supabase client bypass.
--
-- Rules:
-- - SELECT/DELETE: unchanged access for business owners / co-owners / active members.
-- - INSERT/UPDATE: allowed only when the row is not template_key = 'custom', OR the
--   business plan is not effectively "free" (matches app normalizePlanCodeToKey for
--   values like business_grow_monthly).

drop policy if exists "Business owners can manage review_email_templates"
  on public.review_invite_email_templates;

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
      or exists (
        select 1
        from public.businesses b
        where b.id = business_id
          and split_part(
            case
              when position('business_' in lower(trim(both from b.plan))) = 1
                then substring(lower(trim(both from b.plan)) from 10)
              else lower(trim(both from b.plan))
            end,
            '_',
            1
          ) <> 'free'
      )
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
      or exists (
        select 1
        from public.businesses b
        where b.id = business_id
          and split_part(
            case
              when position('business_' in lower(trim(both from b.plan))) = 1
                then substring(lower(trim(both from b.plan)) from 10)
              else lower(trim(both from b.plan))
            end,
            '_',
            1
          ) <> 'free'
      )
    )
  );

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

comment on policy "review_invite_email_templates_insert" on public.review_invite_email_templates is
  'Members can insert rows; custom template rows require a non-free business.plan (first segment of plan code).';

comment on policy "review_invite_email_templates_update" on public.review_invite_email_templates is
  'Members can update rows; custom template rows require a non-free business.plan (first segment of plan code).';

notify pgrst, 'reload schema';
