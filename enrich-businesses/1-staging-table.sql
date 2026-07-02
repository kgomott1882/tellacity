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
