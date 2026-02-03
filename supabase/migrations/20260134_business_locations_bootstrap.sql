-- Run this first if you get "relation public.business_locations does not exist".
-- Creates business_locations if missing, then adds all columns used by other migrations.
-- Safe to run even if the table or some columns already exist.
-- Requires: public.businesses must exist (and public.reviews for the location_id column).

-- 1) Create the table if it doesn't exist (from 20260128_public_profile_settings)
create table if not exists public.business_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text,
  address text,
  city text,
  postcode text,
  country_code text default 'ZA',
  created_at timestamptz default now()
);

create index if not exists business_locations_business_id_idx on public.business_locations (business_id);

alter table public.business_locations enable row level security;

drop policy if exists "Business owners can manage own locations" on public.business_locations;
create policy "Business owners can manage own locations"
  on public.business_locations for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_locations.business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_locations.business_id and b.owner_id = auth.uid()
    )
  );

-- 2) CSV import / extra columns (from 20260128_business_locations_import_columns)
alter table public.business_locations
  add column if not exists external_id text,
  add column if not exists street_address_2 text,
  add column if not exists state_region text,
  add column if not exists phone text,
  add column if not exists website text;

-- 3) Location profile (headline, description) and review router (from 20260128_location_profile_and_review_router)
alter table public.business_locations
  add column if not exists headline text,
  add column if not exists description text;

comment on column public.business_locations.headline is 'Optional headline for location profile (match main profile or customize)';
comment on column public.business_locations.description is 'Optional description for location profile';

-- Review router: tie reviews to a specific location (optional; null = business-level)
alter table public.reviews
  add column if not exists location_id uuid references public.business_locations (id) on delete set null;

create index if not exists reviews_location_id_idx on public.reviews (location_id);
comment on column public.reviews.location_id is 'Optional: specific location this review refers to; null = business-level';
