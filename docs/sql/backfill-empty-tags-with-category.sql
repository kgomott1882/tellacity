-- =============================================================================
-- Tellacity — Backfill empty tags with the row's category_slug. (Chunked.)
--
-- WHY:
--   /tags/[tag_slug] listings only surface rows whose `tags` array contains
--   the requested tag. Active businesses with an empty `tags` array are
--   invisible to the entire tag-page taxonomy, which (combined with the
--   /tags page noindex bug, fixed separately) is why Search Console shows
--   ~11.8K "Excluded by 'noindex' tag" pages.
--
-- WHAT IT DOES:
--   For every ACTIVE business with no tags (or NULL tags), set
--   `tags = ARRAY[category_slug]::text[]`. This guarantees every active
--   business is discoverable via at least one tag page (the one that
--   matches its primary category).
--
-- HOW TO RUN:
--   The Supabase SQL editor enforces a per-statement timeout (~60s), so a
--   single bulk UPDATE on a 13K+ backlog will fail with
--     "SQL query ran into an upstream timeout".
--   Run STEP 1 ONCE to see how many rows still need backfilling, then run
--   STEP 2 repeatedly. Each click updates up to 1,000 rows and returns the
--   count. Keep clicking Run until STEP 2 returns 0. Typical run: 10–20
--   clicks for ~10K rows.
--
-- SAFETY:
--   * Touches ONLY rows where `status = 'active'` AND tags is NULL/empty.
--   * Skips rows with NULL/empty `category_slug`.
--   * Idempotent — re-running has no effect once the backlog is drained.
-- =============================================================================


-- STEP 1 — How many rows still need a fallback tag?
SELECT count(*) AS rows_remaining
FROM public.businesses
WHERE status = 'active'
  AND category_slug IS NOT NULL
  AND category_slug <> ''
  AND (tags IS NULL OR cardinality(tags) = 0);


-- STEP 2 — Backfill up to 1,000 rows per click. Run repeatedly until the
-- "updated" count comes back as 0. Each run is a single short transaction
-- that fits comfortably inside the editor timeout.
WITH to_update AS (
  SELECT id
  FROM public.businesses
  WHERE status = 'active'
    AND category_slug IS NOT NULL
    AND category_slug <> ''
    AND (tags IS NULL OR cardinality(tags) = 0)
  LIMIT 1000
), did_update AS (
  UPDATE public.businesses AS b
  SET tags = ARRAY[b.category_slug]::text[]
  FROM to_update u
  WHERE b.id = u.id
  RETURNING b.id
)
SELECT count(*) AS updated FROM did_update;


-- STEP 3 (optional) — sanity check: rows still empty after backlog drains.
-- Anything left here either has no category_slug or isn't active and is
-- legitimately skipped.
-- SELECT id, slug, name, category_slug, status, tags
-- FROM public.businesses
-- WHERE (tags IS NULL OR cardinality(tags) = 0)
-- ORDER BY status, id
-- LIMIT 100;
