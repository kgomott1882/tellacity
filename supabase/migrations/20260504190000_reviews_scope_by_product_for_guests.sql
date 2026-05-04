-- Guest / logged-in reviews: allow multiple product reviews per business.
-- Uniqueness:
--   - Business-level review (no product): one per (email + business) or (user_id + business)
--   - Product review: one per (email + product_photo_id) or (user_id + product_photo_id)
-- Drops legacy unique(business_id, guest_email) / similar so product rows can coexist.

-- 1) Drop legacy uniqueness on public.reviews (names vary by environment)
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.oid, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'reviews'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%guest_email%'
      AND pg_get_constraintdef(c.oid) LIKE '%business_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', con.conname);
    RAISE NOTICE 'Dropped reviews unique constraint: %', con.conname;
  END LOOP;
END $$;

DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.oid, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'reviews'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%user_id%'
      AND pg_get_constraintdef(c.oid) LIKE '%business_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', con.conname);
    RAISE NOTICE 'Dropped reviews user+business unique constraint: %', con.conname;
  END LOOP;
END $$;

-- Named fallbacks (Supabase / hand-created)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_guest_email_business_unique;
DROP INDEX IF EXISTS public.reviews_guest_email_business_unique;
DROP INDEX IF EXISTS public.reviews_business_id_guest_email_key;

-- 2) Drop legacy uniqueness on review_drafts blocking multiple OTP flows per business email
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.oid, c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'review_drafts'
      AND c.contype = 'u'
      AND pg_get_constraintdef(c.oid) LIKE '%email%'
      AND pg_get_constraintdef(c.oid) LIKE '%business_id%'
  LOOP
    EXECUTE format('ALTER TABLE public.review_drafts DROP CONSTRAINT %I', con.conname);
    RAISE NOTICE 'Dropped review_drafts unique constraint: %', con.conname;
  END LOOP;
END $$;

-- 2b) Remove duplicate rows so new partial unique indexes can be created.
--     Keep the newest draft/review per partition (ties broken by id DESC).
--     review_otps rows CASCADE-delete with removed drafts.

-- Pending drafts: general (no product_photo_id), same business + email
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY business_id, lower(trim(email))
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.review_drafts
  WHERE product_photo_id IS NULL
    AND email IS NOT NULL
    AND trim(email) <> ''
)
DELETE FROM public.review_drafts rd
USING ranked r
WHERE rd.id = r.id AND r.rn > 1;

-- Pending drafts: product-scoped, same product + email
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY product_photo_id, lower(trim(email))
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.review_drafts
  WHERE product_photo_id IS NOT NULL
    AND email IS NOT NULL
    AND trim(email) <> ''
)
DELETE FROM public.review_drafts rd
USING ranked r
WHERE rd.id = r.id AND r.rn > 1;

-- Published reviews: guest, business-level (no product)
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY business_id, lower(trim(guest_email))
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.reviews
  WHERE guest_email IS NOT NULL
    AND trim(guest_email) <> ''
    AND product_photo_id IS NULL
)
DELETE FROM public.reviews rev
USING ranked r
WHERE rev.id = r.id AND r.rn > 1;

-- Published reviews: guest + product photo
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY product_photo_id, lower(trim(guest_email))
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.reviews
  WHERE guest_email IS NOT NULL
    AND trim(guest_email) <> ''
    AND product_photo_id IS NOT NULL
)
DELETE FROM public.reviews rev
USING ranked r
WHERE rev.id = r.id AND r.rn > 1;

-- Published reviews: authenticated, business-level
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY business_id, user_id
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.reviews
  WHERE user_id IS NOT NULL
    AND product_photo_id IS NULL
)
DELETE FROM public.reviews rev
USING ranked r
WHERE rev.id = r.id AND r.rn > 1;

-- Published reviews: authenticated + product
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY product_photo_id, user_id
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) AS rn
  FROM public.reviews
  WHERE user_id IS NOT NULL
    AND product_photo_id IS NOT NULL
)
DELETE FROM public.reviews rev
USING ranked r
WHERE rev.id = r.id AND r.rn > 1;

-- 3) Partial unique indexes — guests
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

-- 4) Partial unique indexes — authenticated reviewers (user_id)
CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_business_no_product_uniq
  ON public.reviews (business_id, user_id)
  WHERE user_id IS NOT NULL AND product_photo_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_photo_uniq
  ON public.reviews (product_photo_id, user_id)
  WHERE user_id IS NOT NULL AND product_photo_id IS NOT NULL;

-- 5) Pending OTP drafts: one open draft per scope (general vs product)
CREATE UNIQUE INDEX IF NOT EXISTS review_drafts_pending_guest_business_general_uniq
  ON public.review_drafts (business_id, (lower(trim(email))))
  WHERE product_photo_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS review_drafts_pending_guest_product_uniq
  ON public.review_drafts (product_photo_id, (lower(trim(email))))
  WHERE product_photo_id IS NOT NULL;

COMMENT ON INDEX public.reviews_guest_product_photo_uniq IS
  'At most one published guest review per product photo (email match).';
COMMENT ON INDEX public.review_drafts_pending_guest_product_uniq IS
  'At most one pending OTP draft per guest email per product photo.';
