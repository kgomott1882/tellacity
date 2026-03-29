-- Allow business users to read their own business_owners rows (dashboard, getUserBusinesses).
alter table public.business_owners enable row level security;

drop policy if exists "authenticated_select_own_business_owners" on public.business_owners;
create policy "authenticated_select_own_business_owners"
  on public.business_owners
  for select
  to authenticated
  using (owner_user_id = auth.uid());
