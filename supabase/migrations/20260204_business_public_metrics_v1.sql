-- Canonical metrics view is public.business_review_metrics_v (business_id, review_count, average_rating).
-- Joins: ON businesses.id = business_review_metrics_v.business_id
-- Drop the old view if it was created by an earlier run.
drop view if exists public.business_public_metrics_v1;
