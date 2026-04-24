-- Manual ordering within section (lower first). Tie-break by created_at on the client/query.

alter table public.business_photos
  add column if not exists sort_order integer not null default 0;

create index if not exists business_photos_business_section_sort_idx
  on public.business_photos (business_id, section, sort_order, created_at desc);
