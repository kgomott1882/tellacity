alter table public.businesses
  add column if not exists logo_fetched_at timestamptz;

comment on column public.businesses.logo_fetched_at is
  'When the logo URL was fetched and stored by backend utility.';
