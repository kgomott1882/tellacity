-- =============================================================================
-- Tellacity — Audit rows parked in `status = 'under_review'`.
--
-- The SEO-normalize trigger
-- (docs/sql/seo-auto-normalize-businesses-trigger.sql section 6) parks
-- "unsalvageable" rows in `under_review` so /b/[slug] emits noindex/nofollow
-- and they're excluded from the sitemap. Most of those rows ARE genuinely
-- junk seeds, but a small share are legitimate businesses that just had a
-- short slug or a missing field at insert time.
--
-- This query surfaces the salvageable ones for manual review. Scan the
-- output; for any row that's clearly a real business, flip it to active
-- with the bulk UPDATE at the bottom.
-- =============================================================================

-- 1. Likely-salvageable under_review rows (5+ char slug, not in the trigger's
--    deny-list, no obvious junk numeric pattern). Pick a manageable batch.
SELECT
  id,
  slug,
  canonical_slug,
  name,
  city,
  country_code,
  category_slug,
  tags,
  created_at
FROM public.businesses
WHERE status = 'under_review'
  AND length(slug) >= 6
  AND lower(slug) NOT IN (
    'unknown','business','unitedstates','unitedkingdom','southafrica',
    'australia','newzealand','ireland','canada'
  )
  AND slug !~ '^\d+$'
  AND slug !~ '^business\d+$'
  AND slug !~ '^unitedstates\d+$'
ORDER BY created_at DESC
LIMIT 200;


-- 2. Total counts by likely-status — helps gauge backlog size before
--    triggering a manual review pass.
-- SELECT
--   CASE
--     WHEN length(slug) >= 6
--          AND lower(slug) NOT IN (
--            'unknown','business','unitedstates','unitedkingdom','southafrica',
--            'australia','newzealand','ireland','canada'
--          )
--          AND slug !~ '^\d+$'
--          AND slug !~ '^business\d+$'
--          AND slug !~ '^unitedstates\d+$'
--       THEN 'salvageable'
--     ELSE 'likely_junk'
--   END AS bucket,
--   count(*)
-- FROM public.businesses
-- WHERE status = 'under_review'
-- GROUP BY 1;


-- 3. Bulk reactivate by id list (run only after manual review of step 1).
-- UPDATE public.businesses
-- SET status = 'active'
-- WHERE id = ANY (ARRAY[
--   'paste-uuid-1-here',
--   'paste-uuid-2-here'
-- ]::uuid[])
--   AND status = 'under_review';


-- 4. Bulk reactivate by slug list (alternative; safer with copy-paste).
-- UPDATE public.businesses
-- SET status = 'active'
-- WHERE slug = ANY (ARRAY[
--   'paste-slug-1-here',
--   'paste-slug-2-here'
-- ]::text[])
--   AND status = 'under_review';
