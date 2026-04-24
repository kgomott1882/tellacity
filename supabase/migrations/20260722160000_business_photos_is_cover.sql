-- Cover image for public business profile banner.

alter table public.business_photos
  add column if not exists is_cover boolean not null default false;
