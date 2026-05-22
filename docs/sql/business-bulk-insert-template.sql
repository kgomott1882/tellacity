-- =============================================================================
-- Tellacity — Bulk business import (single statement, no setup required).
--
-- USE THIS TEMPLATE FOR ALL NEW SEEDS (US, UK, EU, etc.).
-- The legacy US script that didn't populate `canonical_slug` is the root
-- cause of the "Duplicate without user-selected canonical" warnings in
-- Google Search Console. Always emit `canonical_slug` so /b/[slug]/page.tsx
-- can advertise a stable, brand-clean canonical URL in <head>.
--
-- HOW THE LLM SHOULD INTERPRET RAW DATA
-- -------------------------------------
-- Raw bulk lists usually start with a header like:
--     Electronics & Technology
--     Appliances & Electronics
--     Best in Appliances & Electronics
--     United States
--
-- The first 2-3 header lines tell you:
--   primary_group_slug  = first line, kebab-cased and `&`/`and`-normalised
--                         (e.g. "Electronics & Technology"
--                          -> "electronics-and-technology")
--   category_slug       = second line, kebab-cased
--                         (e.g. "Appliances & Electronics"
--                          -> "appliances-and-electronics")
--   country_code        = ISO-3166 alpha-2 derived from the country line
--                         (US, GB, CA, AU, ...)
--
-- COLUMN RULES (READ CAREFULLY)
-- -----------------------------
--   name             Display name. Keep original casing/punctuation.
--   slug             URL slug. Must be UNIQUE across `businesses`.
--                    For brand-only entries  -> kebab-cased brand name.
--                    For city-specific entries -> "<brand>-<city>".
--                    Allowed: a-z, 0-9, hyphens. Never include "united-states"
--                    or other country tokens; those are not slug suffixes.
--   canonical_slug   Brand-clean URL slug. Used as the SEO canonical in <head>.
--                    Strip city, branch suffix, ".com", "ltd", country tokens.
--                    Equal to `slug` when the brand has no city in its slug.
--                    MUST be UNIQUE across `businesses` when not NULL
--                    (idx_businesses_canonical_slug enforces this).
--   website          Full URL including https://. NULL allowed.
--   address          Street line. NULL allowed.
--   city             City name. NULL when the brand is online-only.
--   country_code     ISO alpha-2.
--   primary_group_slug   FK to primary_groups.slug.
--   category_slug    FK to categories.slug. If the supplied value doesn't
--                    exist in `categories`, the script falls back to
--                    'administration-and-services' and pushes the original
--                    value into `tags` so nothing is lost.
--   status           business_status_enum — typically 'active'.
--   submission_status Text — typically 'approved' for direct seeds.
--   tags             text[]. Sub-labels / micro-categories. Always pass
--                    ARRAY[]::text[] (never NULL). Tags are kebab-cased,
--                    deduplicated, capped at 10.
--
-- BUILT-IN GUARDS (do not remove)
-- -------------------------------
--   * Unknown `category_slug` -> falls back to 'administration-and-services'
--     and preserves the original value inside `tags`. Prevents FK errors.
--   * Tags are kebab-cased, deduped, and capped at 10 in SQL. Prevents
--     businesses_tags_valid_chk failures on raw inputs like "Vegan & Plant-Based".
--   * Inserts use `ON CONFLICT ON CONSTRAINT unique_business_identity DO NOTHING`,
--     so re-running the script is safe.
--   * When the LLM-supplied `tags` array is empty (or becomes empty after
--     normalisation), the script automatically falls back to
--     `ARRAY[category_slug]` so every active business is discoverable via
--     at least one /tags/<slug> page. The bare `category_slug` is already
--     kebab-case and lowercase, so no further normalisation is needed.
-- =============================================================================

WITH raw_rows AS (
  SELECT
    v.*,
    row_number() OVER () AS __rn
  FROM (
    VALUES
      -- ----------------------------------------------------------------------
      -- EDIT BELOW. One tuple per business. Keep column order identical.
      -- ----------------------------------------------------------------------

      -- US brand with a real city.
      (
        'TadiBrothers',
        'tadibrothers-reseda',        -- slug (with city)
        'tadibrothers',               -- canonical_slug (brand-only)
        'https://tadibrothers.com',
        '6924 Canby Ave, #107',
        'Reseda',
        'US',
        'vehicles-and-transportation',
        'vehicle-repair-and-fuel',
        'active'::public.business_status_enum,
        'approved',
        ARRAY['rv-supplies','automotive-accessories']::text[]
      ),
      -- US brand with no city / online-only -> city = NULL, slug = canonical_slug.
      (
        'marcsmobility.com',
        'marcsmobility-com',
        'marcsmobility-com',
        'https://marcsmobility.com',
        NULL,
        NULL,
        'US',
        'vehicles-and-transportation',
        'vehicle-repair-and-fuel',
        'active'::public.business_status_enum,
        'approved',
        ARRAY['mobility-equipment']::text[]
      ),
      -- UK brand with a real city.
      (
        'Highland Kings',
        'highland-kings-largs',
        'highland-kings',
        'https://highland-kings.com',
        'Fairlie Quay Marina, Fairlie Quay',
        'Largs',
        'GB',
        'beauty-and-well-being',
        'personal-care',
        'active'::public.business_status_enum,
        'approved',
        ARRAY['fitness-and-nutrition','running-shop']::text[]
      ),
      -- Brand with no city and no tags. Always ARRAY[]::text[], never NULL.
      (
        'Purdy & Figg',
        'purdy-and-figg',
        'purdy-and-figg',
        'https://purdyandfigg.com',
        NULL,
        NULL,
        'GB',
        'beauty-and-well-being',
        'personal-care',
        'active'::public.business_status_enum,
        'approved',
        ARRAY[]::text[]
      )
  ) AS v(
    name, slug, canonical_slug, website, address, city, country_code,
    primary_group_slug, category_slug, status, submission_status, tags
  )
),
guarded AS (
  SELECT
    r.__rn,
    r.name,
    r.slug,
    r.canonical_slug,
    r.website,
    r.address,
    r.city,
    r.country_code,
    r.primary_group_slug,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.categories c WHERE c.slug = r.category_slug
      )
        THEN r.category_slug
      ELSE 'administration-and-services'
    END AS category_slug,
    r.status,
    r.submission_status,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.categories c WHERE c.slug = r.category_slug
      )
        THEN r.tags
      ELSE r.tags || ARRAY[r.category_slug]
    END AS source_tags
  FROM raw_rows r
),
tags_clean AS (
  SELECT
    g.__rn,
    g.category_slug,
    COALESCE(
      (
        SELECT array_agg(t_norm ORDER BY first_ord)
        FROM (
          SELECT t_norm, MIN(ord) AS first_ord
          FROM (
            SELECT
              NULLIF(
                trim(
                  both '-' from
                  regexp_replace(lower(COALESCE(elem, '')), '[^a-z0-9]+', '-', 'g')
                ),
                ''
              ) AS t_norm,
              ord
            FROM unnest(g.source_tags) WITH ORDINALITY AS u(elem, ord)
          ) normalized
          WHERE t_norm IS NOT NULL
          GROUP BY t_norm
          ORDER BY MIN(ord)
          LIMIT 10
        ) capped
      ),
      ARRAY[]::text[]
    ) AS cleaned_tags
  FROM guarded g
),
tags_with_fallback AS (
  -- Tag-page discoverability guard:
  -- If the LLM-supplied tags array is empty (after normalisation), fall back
  -- to ARRAY[category_slug] so the row is guaranteed to appear on at least
  -- one /tags/<slug> page. This avoids creating active businesses that
  -- are invisible to the entire tag taxonomy.
  SELECT
    tc.__rn,
    CASE
      WHEN cardinality(tc.cleaned_tags) > 0 THEN tc.cleaned_tags
      ELSE ARRAY[tc.category_slug]::text[]
    END AS tags
  FROM tags_clean tc
)
INSERT INTO public.businesses (
  name,
  slug,
  canonical_slug,
  website,
  address,
  city,
  country_code,
  primary_group_slug,
  category_slug,
  status,
  submission_status,
  tags
)
SELECT
  g.name,
  g.slug,
  g.canonical_slug,
  g.website,
  g.address,
  g.city,
  g.country_code,
  g.primary_group_slug,
  g.category_slug,
  g.status,
  g.submission_status,
  tc.tags
FROM guarded g
JOIN tags_with_fallback tc ON tc.__rn = g.__rn
ON CONFLICT ON CONSTRAINT unique_business_identity DO NOTHING;
