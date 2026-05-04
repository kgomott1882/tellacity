-- Each business_photos row already has id uuid PRIMARY KEY.
-- reviews.product_photo_id / review_drafts.product_photo_id reference this id.
-- Ensure every INSERT gets a server-generated UUID (stable product-review target).

alter table public.business_photos
  alter column id set default gen_random_uuid();

comment on column public.business_photos.id is
  'Permanent UUID for this photo row. Assigned on INSERT. Used as reviews.product_photo_id and public item-review URLs (?photoId=). One row per uploaded photo — distinct IDs allow multiple product reviews per business.';
