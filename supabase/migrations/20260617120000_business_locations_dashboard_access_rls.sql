-- Align business_locations RLS with dashboard access (canAccessBusiness):
-- primary owner, business_owners, or active business_members — not only businesses.owner_id.

drop policy if exists "Business owners can manage own locations" on public.business_locations;

create policy "business_locations_dashboard_access"
  on public.business_locations for all
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_locations.business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1
            from public.business_owners bo
            where bo.business_id = b.id
              and bo.owner_user_id = auth.uid()
          )
          or exists (
            select 1
            from public.business_members bm
            where bm.business_id = b.id
              and bm.user_id = auth.uid()
              and bm.status = 'active'
          )
        )
    )
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_locations.business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1
            from public.business_owners bo
            where bo.business_id = b.id
              and bo.owner_user_id = auth.uid()
          )
          or exists (
            select 1
            from public.business_members bm
            where bm.business_id = b.id
              and bm.user_id = auth.uid()
              and bm.status = 'active'
          )
        )
    )
  );

grant select, insert, update, delete on table public.business_locations to authenticated;
