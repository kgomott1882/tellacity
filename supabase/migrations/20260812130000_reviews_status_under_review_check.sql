-- Product review moderation queue writes `reviews.status = 'under_review'`.
-- Some environments still have a legacy `reviews_status_check` that rejects it.
-- Expand allowed values while preserving existing published/null behavior.

alter table public.reviews drop constraint if exists reviews_status_check;

alter table public.reviews
  add constraint reviews_status_check
  check (
    status is null
    or status in ('published', 'approved', 'pending', 'rejected', 'live', 'under_review')
  );

comment on constraint reviews_status_check on public.reviews is
  'Review publication/moderation status; includes under_review for product behavior checks.';
