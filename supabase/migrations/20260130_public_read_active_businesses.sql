-- Allow public profile page to read active business details (address, phone, email, etc.).
-- Dashboard Profile saves to businesses; public page must be able to read the same row.
-- RLS: anon can read active businesses; authenticated can read all and update own.

alter table public.businesses enable row level security;

-- Anon: read only active businesses (for public profile page)
drop policy if exists "anon_select_active_businesses" on public.businesses;
create policy "anon_select_active_businesses"
  on public.businesses for select to anon
  using (coalesce(status, 'active') = 'active');

-- Authenticated: read all (for dashboard list and profile load)
drop policy if exists "authenticated_select_businesses" on public.businesses;
create policy "authenticated_select_businesses"
  on public.businesses for select to authenticated
  using (true);

-- Authenticated: update only own businesses (via business_owners or owner_id)
drop policy if exists "authenticated_update_own_business" on public.businesses;
create policy "authenticated_update_own_business"
  on public.businesses for update to authenticated
  using (
    exists (
      select 1 from public.business_owners bo
      where bo.business_id = id and bo.owner_user_id = auth.uid()
    )
    or owner_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.business_owners bo
      where bo.business_id = id and bo.owner_user_id = auth.uid()
    )
    or owner_id = auth.uid()
  );

-- Allow authenticated insert for claim/signup flows
drop policy if exists "authenticated_insert_business" on public.businesses;
create policy "authenticated_insert_business"
  on public.businesses for insert to authenticated
  with check (true);
