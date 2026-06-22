-- Fix business_logos upsert: UPDATE policy needs WITH CHECK for ON CONFLICT DO UPDATE.
-- (Client direct uploads; server route uses service role but this keeps policies correct.)

drop policy if exists "business_logos_authenticated_update" on storage.objects;
create policy "business_logos_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'business_logos')
  with check (bucket_id = 'business_logos');
