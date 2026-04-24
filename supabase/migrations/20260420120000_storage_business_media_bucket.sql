-- Storage bucket "business_media" for profile photo uploads (gallery / team / workspace / products / services).
-- Mirrors the policy shape used for business_logos.
-- Safe to re-run: bucket upsert + drop/recreate policies.

-- 1. Create the bucket if missing, public read so profile photos load on public pages.
insert into storage.buckets (id, name, public)
values ('business_media', 'business_media', true)
on conflict (id) do update set public = excluded.public;

-- 2. Authenticated users may upload new objects in business_media.
drop policy if exists "business_media_authenticated_insert" on storage.objects;
create policy "business_media_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'business_media');

-- 3. Authenticated users may update objects (re-upload / replace) in business_media.
drop policy if exists "business_media_authenticated_update" on storage.objects;
create policy "business_media_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'business_media');

-- 4. Authenticated users may delete objects in business_media.
drop policy if exists "business_media_authenticated_delete" on storage.objects;
create policy "business_media_authenticated_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'business_media');

-- 5. Public read so <img src="/storage/v1/object/public/business_media/..."> works without auth.
drop policy if exists "business_media_public_select" on storage.objects;
create policy "business_media_public_select"
  on storage.objects for select to public
  using (bucket_id = 'business_media');
