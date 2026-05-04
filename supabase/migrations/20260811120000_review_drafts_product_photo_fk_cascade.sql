-- Deleting a business_photos row used to SET NULL on review_drafts.product_photo_id.
-- That could create two (business_id, email) “general” draft rows and violate
-- review_drafts_pending_guest_business_general_uniq. Pending item-review drafts
-- should disappear with the product photo instead.

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'review_drafts'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) LIKE '%product_photo_id%'
    AND pg_get_constraintdef(c.oid) LIKE '%business_photos%'
  LIMIT 1;

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.review_drafts DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.review_drafts
  ADD CONSTRAINT review_drafts_product_photo_id_fkey
  FOREIGN KEY (product_photo_id)
  REFERENCES public.business_photos (id)
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT review_drafts_product_photo_id_fkey ON public.review_drafts IS
  'When a product photo is removed, drop pending OTP drafts for that item (review_otps cascade from draft).';
