-- =========================================================================
-- business_photos: draft/publish workflow + per-business section config.
-- Safe to re-run.
-- =========================================================================

-- 1. Status column (draft | published) + published_at timestamp on photos.
alter table public.business_photos
  add column if not exists status text not null default 'draft';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'business_photos_status_check'
      and conrelid = 'public.business_photos'::regclass
  ) then
    alter table public.business_photos
      add constraint business_photos_status_check
      check (status in ('draft', 'published'));
  end if;
end $$;

alter table public.business_photos
  add column if not exists published_at timestamptz;

-- Backfill: treat pre-existing rows as already published so public profiles
-- don't suddenly go blank after this migration lands.
-- We set published_at to 31+ days in the past so existing Free-plan users
-- aren't retroactively trapped inside the new 30-day publish lock. The lock
-- only kicks in on their NEXT publish action.
update public.business_photos
  set status = 'published',
      published_at = coalesce(published_at, now() - interval '31 days')
  where status = 'draft'
    and created_at < now() - interval '5 minutes';

create index if not exists business_photos_status_idx
  on public.business_photos (business_id, status);

-- 2. Only ONE cover photo per business (enforced via partial unique index).
drop index if exists business_photos_cover_unique_per_business;
create unique index business_photos_cover_unique_per_business
  on public.business_photos (business_id)
  where is_cover = true;

-- 3. Public read policy: anon / authenticated only see published photos
--    on active businesses.
drop policy if exists "business_photos_public_select" on public.business_photos;
create policy "business_photos_public_select"
  on public.business_photos for select
  to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.businesses b
      where b.id = business_photos.business_id
        and b.status = 'active'
    )
  );

-- 4. Per-business section configuration table.
--    - Seeded with 5 built-ins per business (can be disabled but not deleted).
--    - Owners may add custom sections with their own title/slug.
create table if not exists public.business_photo_sections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  slug text not null,
  title text not null,
  is_enabled boolean not null default true,
  is_builtin boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (business_id, slug)
);

create index if not exists business_photo_sections_business_idx
  on public.business_photo_sections (business_id, sort_order);

alter table public.business_photo_sections enable row level security;

-- Public read: only enabled sections on active businesses.
drop policy if exists "business_photo_sections_public_select"
  on public.business_photo_sections;
create policy "business_photo_sections_public_select"
  on public.business_photo_sections for select
  to anon, authenticated
  using (
    is_enabled = true
    and exists (
      select 1 from public.businesses b
      where b.id = business_photo_sections.business_id
        and b.status = 'active'
    )
  );

-- Dashboard CRUD: owner / co-owner / active member may read-write all sections
-- for their business (including disabled ones).
drop policy if exists "business_photo_sections_dashboard_all"
  on public.business_photo_sections;
create policy "business_photo_sections_dashboard_all"
  on public.business_photo_sections for all
  to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_photo_sections.business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1 from public.business_owners bo
            where bo.business_id = b.id and bo.owner_user_id = auth.uid()
          )
          or exists (
            select 1 from public.business_members bm
            where bm.business_id = b.id
              and bm.user_id = auth.uid()
              and bm.status = 'active'
          )
        )
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_photo_sections.business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1 from public.business_owners bo
            where bo.business_id = b.id and bo.owner_user_id = auth.uid()
          )
          or exists (
            select 1 from public.business_members bm
            where bm.business_id = b.id
              and bm.user_id = auth.uid()
              and bm.status = 'active'
          )
        )
    )
  );

grant select on table public.business_photo_sections to anon;
grant select, insert, update, delete on table public.business_photo_sections to authenticated;

-- 5. Seed built-in sections for every existing business.
insert into public.business_photo_sections
  (business_id, slug, title, is_builtin, is_enabled, sort_order)
select b.id, v.slug, v.title, true, true, v.sort_order
from public.businesses b
cross join (values
  ('gallery',   'Gallery',   10),
  ('team',      'Team',      20),
  ('workspace', 'Workspace', 30),
  ('products',  'Products',  40),
  ('services',  'Services',  50)
) as v(slug, title, sort_order)
on conflict (business_id, slug) do nothing;

-- 6. Helper view: last publish time per business (used for 30-day Free lock).
create or replace view public.business_photo_publish_latest as
  select business_id, max(published_at) as last_published_at
  from public.business_photos
  where status = 'published'
    and published_at is not null
  group by business_id;

grant select on public.business_photo_publish_latest to anon, authenticated;
