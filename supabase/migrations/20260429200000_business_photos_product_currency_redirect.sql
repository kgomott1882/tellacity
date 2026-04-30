-- Per-photo buy/redirect URL (optional; overrides business-level buy link for this item).
alter table public.business_photos
  add column if not exists product_redirect_url text;

-- ISO 4217 currency code for product_price display (default USD for existing rows).
alter table public.business_photos
  add column if not exists product_currency text default 'USD';

comment on column public.business_photos.product_redirect_url is
  'Optional checkout/product URL for this photo (Products section).';

comment on column public.business_photos.product_currency is
  'ISO 4217 code for formatting product_price (e.g. USD, EUR, ZAR).';
