-- Reference number: ask reviewers for a reference number (per business)
alter table public.businesses
  add column if not exists reference_number_enabled boolean not null default false;

-- Categories: secondary category slugs (primary is category_slug; up to 5 secondary)
alter table public.businesses
  add column if not exists secondary_category_slugs text[] default '{}';

-- Business locations (for multi-location businesses)
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

-- RLS: business owners can manage their locations (via businesses.owner_id)
create policy "Business owners can manage own locations"
  on public.business_locations for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_locations.business_id
      and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_locations.business_id
      and b.owner_id = auth.uid()
    )
  );
