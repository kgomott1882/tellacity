-- Storage bucket "business_logos" for profile logo uploads (underscore to match existing bucket).
-- Run this if you need policies; bucket may already exist as business_logos in Dashboard.

-- Allow authenticated users to upload (INSERT) and update/delete in business_logos
drop policy if exists "business_logos_authenticated_insert" on storage.objects;
create policy "business_logos_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'business_logos');

drop policy if exists "business_logos_authenticated_update" on storage.objects;
create policy "business_logos_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'business_logos');

drop policy if exists "business_logos_authenticated_delete" on storage.objects;
create policy "business_logos_authenticated_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'business_logos');

-- Allow everyone to read (public bucket – for logo on public profile page)
drop policy if exists "business_logos_public_select" on storage.objects;
create policy "business_logos_public_select"
  on storage.objects for select to public
  using (bucket_id = 'business_logos');
