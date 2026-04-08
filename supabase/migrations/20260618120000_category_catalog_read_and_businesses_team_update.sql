-- Categories settings + public catalog: ensure category_groups and categories are readable
-- via anon/authenticated (42501 "permission denied for table category_groups" otherwise).
-- Also allow active business_members to UPDATE businesses (e.g. save category slugs),
-- matching canAccessBusiness — previously only owner_id / business_owners could update.

-- ── Taxonomy (reference data; safe for all clients to read) ─────────────────
grant usage on schema public to anon, authenticated;

grant select on table public.category_groups to anon, authenticated;
grant select on table public.categories to anon, authenticated;

alter table public.category_groups enable row level security;
alter table public.categories enable row level security;

drop policy if exists "public_read_category_groups" on public.category_groups;
create policy "public_read_category_groups"
  on public.category_groups
  for select
  to anon, authenticated
  using (true);

drop policy if exists "public_read_categories" on public.categories;
create policy "public_read_categories"
  on public.categories
  for select
  to anon, authenticated
  using (true);

-- ── Businesses: team members may update (categories, profile fields, etc.) ──
drop policy if exists "authenticated_update_own_business" on public.businesses;
create policy "authenticated_update_own_business"
  on public.businesses for update to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.business_owners bo
      where bo.business_id = id
        and bo.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.business_owners bo
      where bo.business_id = id
        and bo.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = id
        and bm.user_id = auth.uid()
        and bm.status = 'active'
    )
  );

grant update on table public.businesses to authenticated;
