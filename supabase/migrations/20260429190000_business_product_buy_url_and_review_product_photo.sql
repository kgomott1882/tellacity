-- Optional storefront / checkout URL for "Buy" from product previews (business-level).
alter table public.businesses
  add column if not exists product_buy_url text;

comment on column public.businesses.product_buy_url is
  'Optional URL opened when customers tap Buy on a product photo (e.g. shop checkout).';

-- Link a guest review draft / published review to a specific business_photos row (item review).
alter table public.review_drafts
  add column if not exists product_photo_id uuid references public.business_photos (id) on delete set null;

alter table public.reviews
  add column if not exists product_photo_id uuid references public.business_photos (id) on delete set null;

create index if not exists review_drafts_product_photo_id_idx
  on public.review_drafts (product_photo_id)
  where product_photo_id is not null;

create index if not exists reviews_product_photo_id_idx
  on public.reviews (product_photo_id)
  where product_photo_id is not null;
