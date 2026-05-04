-- Legacy unique indexes on public.reviews scoped only by (business_id, guest_email)
-- or (business_id, user_id) apply to ALL guest/authenticated rows — including
-- product reviews where product_photo_id IS NOT NULL. That blocks multiple item
-- reviews per email for the same business.
--
-- Canonical rules are ONLY:
--   reviews_guest_business_no_product_uniq / reviews_user_business_no_product_uniq
--   reviews_guest_product_photo_uniq       / reviews_user_product_photo_uniq
--
-- Safe to drop: uniqueness for general vs product scopes is preserved by those partial indexes.

DROP INDEX IF EXISTS public.unique_guest_review;
DROP INDEX IF EXISTS public.ux_reviews_one_review_per_business_email;
DROP INDEX IF EXISTS public.unique_user_business_review;
DROP INDEX IF EXISTS public.unique_guest_email_business;
DROP INDEX IF EXISTS public.unique_user_review;
DROP INDEX IF EXISTS public.ux_reviews_one_review_per_business_user;
