-- Optional product showcase metadata per business photo.
-- Used primarily for photos in the "products" section.

alter table public.business_photos
  add column if not exists product_name text;

alter table public.business_photos
  add column if not exists product_description text;

alter table public.business_photos
  add column if not exists product_price numeric(12,2);

-- Basic hygiene for existing rows.
update public.business_photos
set
  product_name = nullif(btrim(coalesce(product_name, '')), ''),
  product_description = nullif(btrim(coalesce(product_description, '')), '');
