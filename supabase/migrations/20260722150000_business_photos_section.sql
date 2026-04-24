-- business_photos: optional gallery / profile images per business, with section grouping.

create table if not exists public.business_photos (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.business_photos add column if not exists section text;

update public.business_photos
set section = 'gallery'
where section is null;

alter table public.business_photos
  alter column section set default 'gallery',
  alter column section set not null;

create index if not exists business_photos_business_id_idx on public.business_photos (business_id);

alter table public.business_photos enable row level security;

drop policy if exists "business_photos_dashboard_access" on public.business_photos;

create policy "business_photos_dashboard_access"
  on public.business_photos for all
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_photos.business_id
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
      where b.id = business_photos.business_id
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

grant select, insert, update, delete on table public.business_photos to authenticated;
