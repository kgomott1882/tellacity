-- Public profile: allow read of photos for active businesses (anon + authenticated SELECT).

grant select on table public.business_photos to anon;

drop policy if exists "business_photos_public_select" on public.business_photos;

create policy "business_photos_public_select"
  on public.business_photos for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_photos.business_id
        and b.status = 'active'
    )
  );
