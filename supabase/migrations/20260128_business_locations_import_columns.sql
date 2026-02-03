-- Extra columns for CSV import (Import multiple locations)
alter table public.business_locations
  add column if not exists external_id text,
  add column if not exists street_address_2 text,
  add column if not exists state_region text,
  add column if not exists phone text,
  add column if not exists website text;
