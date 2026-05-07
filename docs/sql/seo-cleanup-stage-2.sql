-- =============================================================================
-- SEO cleanup — Stage 2: data archival
-- =============================================================================
-- Purpose: remove from public/sitemap surface the rows that are causing the
-- "Duplicate without user-selected canonical" reports in Google Search Console.
--
-- Strategy: SOFT archive only (status = 'under_review'). No DELETE. Reversible
-- at any time by flipping status back to 'active'. Once status != 'active',
-- /b/[slug] returns `<meta name="robots" content="noindex" />` and the row is
-- excluded from app/business-sitemaps/[id].xml.
--
-- IMPORTANT: every SECTION starts with a SELECT preview. Run the SELECT and
-- eyeball the results BEFORE running the corresponding UPDATE.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECTION A — Garbage / placeholder rows (102 rows in the QA snapshot)
-- -----------------------------------------------------------------------------
-- Rows with junk slugs like "5", "8", "unknown", "business", "business2",
-- "unitedstates", "wilmington" etc. These were bad seed inserts; they're
-- live but provide no SEO value and dilute Google's quality signal.
--
-- Heuristic: slug is null/empty, < 3 chars, all digits, or matches a
-- known placeholder word.

-- A1. Preview which rows would be archived
SELECT
  id,
  slug,
  canonical_slug,
  name,
  city,
  country_code,
  created_at
FROM public.businesses
WHERE status = 'active'
  AND (
    slug IS NULL
    OR length(trim(slug)) < 3
    OR slug ~ '^\d+$'
    OR lower(trim(slug)) IN ('unknown', 'business', 'unitedstates', 'unitedkingdom', 'southafrica', 'australia', 'newzealand', 'ireland', 'canada')
    OR slug ~ '^business\d+$'
    OR slug ~ '^unitedstates\d+$'
  )
ORDER BY slug
LIMIT 500;

-- A2. Count what A1 would archive
SELECT count(*) AS would_archive_garbage_rows
FROM public.businesses
WHERE status = 'active'
  AND (
    slug IS NULL
    OR length(trim(slug)) < 3
    OR slug ~ '^\d+$'
    OR lower(trim(slug)) IN ('unknown', 'business', 'unitedstates', 'unitedkingdom', 'southafrica', 'australia', 'newzealand', 'ireland', 'canada')
    OR slug ~ '^business\d+$'
    OR slug ~ '^unitedstates\d+$'
  );

-- A3. APPLY — only run after eyeballing A1 / A2
-- UPDATE public.businesses
-- SET status = 'under_review',
--     updated_at = now()
-- WHERE status = 'active'
--   AND (
--     slug IS NULL
--     OR length(trim(slug)) < 3
--     OR slug ~ '^\d+$'
--     OR lower(trim(slug)) IN ('unknown', 'business', 'unitedstates', 'unitedkingdom', 'southafrica', 'australia', 'newzealand', 'ireland', 'canada')
--     OR slug ~ '^business\d+$'
--     OR slug ~ '^unitedstates\d+$'
--   );


-- -----------------------------------------------------------------------------
-- SECTION B — Seed duplicates (87 rows in the QA snapshot)
-- -----------------------------------------------------------------------------
-- Rows that share a canonical_slug with one or more siblings AND collectively
-- have <= rows-1 distinct non-empty cities. Translation: same brand name,
-- no real per-location differentiation. Examples from your data:
--   apple / apple2 / appleuk / appleuk2 / applecupertino
--   aramex / aramexunitedstates / aramexunitedkingdom / aramexunitedkingdom2
--   wikipedia / wikipediauk / wikipediaatlanta / wikipediasanfrancisco
--
-- KEEP one canonical row per family (the cleanest, oldest one). ARCHIVE the
-- rest. We never touch chain-like families (e.g. greenleaf-tobacco-vape
-- across 11 Iowa towns — those have distinct cities so they are excluded).

-- B1. Identify families that qualify as seed-dup
WITH families AS (
  SELECT
    canonical_slug,
    count(*)                                                                       AS rows_in_family,
    count(DISTINCT lower(nullif(trim(coalesce(city, '')), '')))                    AS distinct_non_empty_cities
  FROM public.businesses
  WHERE status = 'active'
    AND canonical_slug IS NOT NULL
    AND canonical_slug <> ''
  GROUP BY canonical_slug
  HAVING count(*) > 1
)
SELECT canonical_slug, rows_in_family, distinct_non_empty_cities
FROM families
WHERE distinct_non_empty_cities < rows_in_family - 1
ORDER BY rows_in_family DESC, canonical_slug
LIMIT 100;

-- B2. Within each seed-dup family, choose the row to KEEP (shortest slug, then
--     oldest), and list the rows that would be ARCHIVED (everything else).
WITH families AS (
  SELECT canonical_slug
  FROM public.businesses
  WHERE status = 'active'
    AND canonical_slug IS NOT NULL
    AND canonical_slug <> ''
  GROUP BY canonical_slug
  HAVING count(*) > 1
     AND count(DISTINCT lower(nullif(trim(coalesce(city, '')), ''))) < count(*) - 1
),
ranked AS (
  SELECT
    b.id,
    b.slug,
    b.canonical_slug,
    b.name,
    b.city,
    b.created_at,
    row_number() OVER (
      PARTITION BY b.canonical_slug
      ORDER BY length(b.slug) ASC, b.created_at ASC, b.id ASC
    ) AS rn
  FROM public.businesses b
  JOIN families f USING (canonical_slug)
  WHERE b.status = 'active'
)
SELECT id, slug, canonical_slug, name, city, created_at,
       CASE WHEN rn = 1 THEN 'KEEP' ELSE 'ARCHIVE' END AS action
FROM ranked
ORDER BY canonical_slug, rn;

-- B3. Count how many rows would actually flip to under_review
WITH families AS (
  SELECT canonical_slug
  FROM public.businesses
  WHERE status = 'active'
    AND canonical_slug IS NOT NULL
    AND canonical_slug <> ''
  GROUP BY canonical_slug
  HAVING count(*) > 1
     AND count(DISTINCT lower(nullif(trim(coalesce(city, '')), ''))) < count(*) - 1
),
ranked AS (
  SELECT
    b.id,
    row_number() OVER (
      PARTITION BY b.canonical_slug
      ORDER BY length(b.slug) ASC, b.created_at ASC, b.id ASC
    ) AS rn
  FROM public.businesses b
  JOIN families f USING (canonical_slug)
  WHERE b.status = 'active'
)
SELECT count(*) AS would_archive_seed_dup_rows
FROM ranked
WHERE rn > 1;

-- B4. APPLY — only run after eyeballing B1 / B2 / B3
-- WITH families AS (
--   SELECT canonical_slug
--   FROM public.businesses
--   WHERE status = 'active'
--     AND canonical_slug IS NOT NULL
--     AND canonical_slug <> ''
--   GROUP BY canonical_slug
--   HAVING count(*) > 1
--      AND count(DISTINCT lower(nullif(trim(coalesce(city, '')), ''))) < count(*) - 1
-- ),
-- ranked AS (
--   SELECT
--     b.id,
--     row_number() OVER (
--       PARTITION BY b.canonical_slug
--       ORDER BY length(b.slug) ASC, b.created_at ASC, b.id ASC
--     ) AS rn
--   FROM public.businesses b
--   JOIN families f USING (canonical_slug)
--   WHERE b.status = 'active'
-- )
-- UPDATE public.businesses
-- SET status = 'under_review',
--     updated_at = now()
-- WHERE id IN (SELECT id FROM ranked WHERE rn > 1);


-- -----------------------------------------------------------------------------
-- SECTION C — (OPTIONAL) Verify after applying A & B
-- -----------------------------------------------------------------------------
-- Re-run the original Q1 + Q2-PLUS to confirm the cleanup landed.

SELECT
  count(*)                                                     AS total_active,
  count(*) FILTER (WHERE canonical_slug IS NULL OR canonical_slug = '')
                                                               AS missing_or_empty_canonical,
  count(*) FILTER (WHERE canonical_slug = slug)                AS canonical_equals_slug,
  count(*) FILTER (WHERE canonical_slug IS NOT NULL
                     AND canonical_slug <> ''
                     AND canonical_slug <> slug)               AS canonical_differs_from_slug
FROM public.businesses
WHERE status = 'active';

WITH families AS (
  SELECT
    canonical_slug,
    count(*)                                              AS rows_in_family,
    count(DISTINCT lower(nullif(trim(coalesce(city, '')), '')))
                                                          AS distinct_non_empty_cities
  FROM public.businesses
  WHERE status = 'active'
    AND canonical_slug IS NOT NULL
    AND canonical_slug <> ''
  GROUP BY canonical_slug
)
SELECT
  count(*) FILTER (WHERE rows_in_family = 1)                                  AS singleton_families,
  count(*) FILTER (WHERE rows_in_family > 1
                     AND distinct_non_empty_cities >= rows_in_family - 1)     AS chain_like_families,
  count(*) FILTER (WHERE rows_in_family > 1
                     AND distinct_non_empty_cities < rows_in_family - 1)      AS seed_dup_like_families
FROM families;
