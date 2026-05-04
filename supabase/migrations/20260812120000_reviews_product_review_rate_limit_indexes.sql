-- Indexes for API-side product review rate / sweep COUNT queries (service role).
-- Logic lives in app (evaluateProductReviewRateLimits); these keep counts fast at scale.
-- Does not change uniqueness or RLS.

create index if not exists reviews_product_rate_user_created_idx
  on public.reviews (user_id, created_at desc)
  where product_photo_id is not null and user_id is not null;

create index if not exists reviews_product_rate_guest_created_idx
  on public.reviews (guest_email, created_at desc)
  where product_photo_id is not null and guest_email is not null;

create index if not exists reviews_product_rate_business_user_created_idx
  on public.reviews (business_id, user_id, created_at desc)
  where product_photo_id is not null and user_id is not null;

create index if not exists reviews_product_rate_business_guest_created_idx
  on public.reviews (business_id, guest_email, created_at desc)
  where product_photo_id is not null and guest_email is not null;

comment on index public.reviews_product_rate_user_created_idx is
  'Product review rate limits: count rows by logged-in reviewer in time windows.';

comment on index public.reviews_product_rate_guest_created_idx is
  'Product review rate limits: count rows by guest_email in time windows.';

comment on index public.reviews_product_rate_business_user_created_idx is
  'Catalog sweep detection: product reviews per business per user in 1h.';

comment on index public.reviews_product_rate_business_guest_created_idx is
  'Catalog sweep detection: product reviews per business per guest email in 1h.';
