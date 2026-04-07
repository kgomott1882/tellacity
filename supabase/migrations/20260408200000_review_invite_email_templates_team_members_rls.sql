-- Align review_invite_email_templates RLS with dashboard access (business_members).
-- Dashboard allows team members via business_members; this table previously did not,
-- causing 42501 "permission denied" for INSERT/UPDATE/SELECT from the browser client.

drop policy if exists "Business owners can manage review_email_templates"
  on public.review_invite_email_templates;

create policy "Business owners can manage review_email_templates"
  on public.review_invite_email_templates
  for all
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

grant select, insert, update, delete on table public.review_invite_email_templates to authenticated;
