-- Defensive: some environments may still have a broad unique on (business_id, guest_email)
-- that blocks multiple product reviews for the same email. Drop legacy names and
-- ensure partial unique indexes from 20260504190000 exist.

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_guest_email_business_unique;
DROP INDEX IF EXISTS public.reviews_guest_email_business_unique;
DROP INDEX IF EXISTS public.reviews_business_id_guest_email_key;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_guest_business_no_product_uniq
  ON public.reviews (business_id, (lower(trim(guest_email))))
  WHERE guest_email IS NOT NULL
    AND trim(guest_email) <> ''
    AND product_photo_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_guest_product_photo_uniq
  ON public.reviews (product_photo_id, (lower(trim(guest_email))))
  WHERE guest_email IS NOT NULL
    AND trim(guest_email) <> ''
    AND product_photo_id IS NOT NULL;
