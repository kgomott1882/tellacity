alter table public.businesses
  add column if not exists logo_fetch_failed boolean not null default false;

comment on column public.businesses.logo_fetch_failed is
  'True when logo fetch failed with a terminal result (e.g. 404) to avoid repeat attempts.';
