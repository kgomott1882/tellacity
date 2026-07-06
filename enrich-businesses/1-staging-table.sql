-- Run this ONCE in Supabase SQL editor before running the script.
create table if not exists business_enrichment_staging (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  source_url text,
  extracted_description text,
  extracted_address text,
  extracted_phone text,
  confidence text not null default 'none',
  raw_snippet text,
  status text not null default 'pending',
  fetched_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (business_id)
);
create index if not exists idx_staging_status on business_enrichment_staging(status);
create index if not exists idx_staging_business_id on business_enrichment_staging(business_id);

-- One-to-many hours staging (separate from the one-to-one enrichment staging above).
create table if not exists business_hours_staging (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  dow integer not null check (dow between 0 and 6),
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  source_url text,
  status text not null default 'pending',
  fetched_at timestamptz not null default now(),
  unique (business_id, dow)
);
create index if not exists idx_hours_staging_status on business_hours_staging(status);
create index if not exists idx_hours_staging_business_id on business_hours_staging(business_id);

-- Server-side batch selection: returns eligible businesses not yet staged.
-- Avoids building a giant client-side NOT IN list (unreliable past ~1000 staged rows).
create or replace function get_unstaged_businesses(limit_count int)
returns table(id uuid, name text, website text, description text, address text, phone text)
language sql stable as $$
  select b.id, b.name, b.website, b.description, b.address, b.phone
  from businesses b
  where b.website is not null and b.website != ''
    and (b.description is null or b.address is null or b.phone is null)
    and not exists (
      select 1 from business_enrichment_staging s where s.business_id = b.id
    )
  limit limit_count;
$$;
