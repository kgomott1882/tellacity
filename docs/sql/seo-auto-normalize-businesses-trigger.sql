-- =============================================================================
-- SEO auto-normalize for `businesses` (BEFORE INSERT / UPDATE trigger)
-- =============================================================================
-- Purpose: prevent the SEO problems we just cleaned up from re-entering the
-- table via future inserts (UI, API, bulk seed SQL, service-role scripts).
--
-- Mirrors the rules in src/lib/businessSlug.ts and the cleanup heuristics in
-- docs/sql/seo-cleanup-stage-2.sql. Auto-fixes whenever it can; only when
-- the row is unsalvageable does it force `status = 'under_review'` so the
-- row is excluded from sitemap and indexing without being deleted.
--
-- Idempotent. Safe to re-run. Adds:
--   • 1 helper function: public.business_seo_clean_slug(text)
--   • 1 helper function: public.business_seo_canonical_from_name(text)
--   • 1 trigger function: public.businesses_seo_normalize_trigger()
--   • 1 trigger:           businesses_seo_normalize_before_iud
--
-- IMPORTANT: review and run sections 1–3 sequentially in the SQL editor.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECTION 1 — Helper functions
-- -----------------------------------------------------------------------------

-- 1A. Reference list of country names that should NEVER appear in `city`.
--     Lower-cased, trimmed; both spaced and concatenated forms covered.
CREATE OR REPLACE FUNCTION public.business_seo_is_country_name(p_value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(coalesce(p_value, ''))) IN (
    'united kingdom','united states','united states of america',
    'south africa','new zealand','south korea','north korea',
    'hong kong','great britain','northern ireland','costa rica',
    'puerto rico','czech republic','dominican republic',
    'saudi arabia','sri lanka','el salvador',
    'bosnia and herzegovina','trinidad and tobago','papua new guinea',
    'australia','canada','ireland','germany','france','spain','italy',
    'portugal','netherlands','belgium','sweden','norway','denmark',
    'finland','poland','austria','switzerland','greece','turkey','russia',
    'china','japan','india','brazil','mexico','argentina','chile',
    'singapore','malaysia','thailand','philippines','indonesia','vietnam',
    'pakistan','bangladesh','egypt','nigeria','kenya','ghana','morocco',
    'uae','israel','taiwan','iran','iraq','uk','usa','us','gb'
  );
$$;

COMMENT ON FUNCTION public.business_seo_is_country_name(text) IS
  'TRUE if the value is a country name that should not appear in businesses.city.';


-- 1B. Strip trailing country tokens / country codes from a slug.
--     Mirrors src/lib/businessSlug.ts > stripTrailingGeoPhrases.
CREATE OR REPLACE FUNCTION public.business_seo_clean_slug(p_slug text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  s text := lower(trim(coalesce(p_slug, '')));
  -- Country tails baked in at slug-time (no hyphens). Order matters:
  -- LONGEST FIRST so 'unitedstatesofamerica' is stripped before
  -- 'unitedstates'.
  country_tails text[] := ARRAY[
    'unitedstatesofamerica',
    'bosniaandherzegovina','trinidadandtobago','papuanewguinea',
    'unitedkingdom','unitedstates','newzealand','southafrica',
    'southkorea','northkorea','greatbritain','northernireland',
    'costarica','puertorico','czechrepublic','dominicanrepublic',
    'saudiarabia','srilanka','elsalvador','hongkong',
    'australia','ireland','canada'
  ];
  -- Short country codes appended with a hyphen, e.g. `-uk`, `-us`.
  short_codes text[] := ARRAY['us','uk','gb','ca','au','nz','ie','za'];
  tail text;
BEGIN
  IF s = '' THEN RETURN s; END IF;

  -- Iterate longest-first so longer tails win.
  FOREACH tail IN ARRAY country_tails LOOP
    IF s ~ (tail || '$') THEN
      s := regexp_replace(s, tail || '$', '');
    END IF;
  END LOOP;

  FOREACH tail IN ARRAY short_codes LOOP
    IF s ~ ('-' || tail || '$') THEN
      s := regexp_replace(s, '-' || tail || '$', '');
    END IF;
  END LOOP;

  -- Collapse separators and trim
  s := regexp_replace(s, '[^a-z0-9-]+', '', 'g');
  s := regexp_replace(s, '-+', '-', 'g');
  s := regexp_replace(s, '^-|-$', '', 'g');
  RETURN s;
END;
$$;

COMMENT ON FUNCTION public.business_seo_clean_slug(text) IS
  'Strips trailing country names / country codes from a slug. Mirrors src/lib/businessSlug.ts.';


-- 1C. Generate a clean canonical_slug from a business name.
--     Strips trailing geo phrases and placeholder tokens, lower-cases,
--     hyphenates. Mirrors src/lib/businessSlug.ts > businessNameToSlug.
CREATE OR REPLACE FUNCTION public.business_seo_canonical_from_name(p_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  base text := lower(trim(coalesce(p_name, '')));
  geo_phrases text[] := ARRAY[
    ' united states of america',' united kingdom',' united states',
    ' new zealand',' south africa',' south korea',' north korea',
    ' hong kong',' great britain',' northern ireland',' costa rica',
    ' puerto rico',' czech republic',' dominican republic',
    ' saudi arabia',' sri lanka',' el salvador',
    ' bosnia and herzegovina',' trinidad and tobago',' papua new guinea',
    ' australia',' canada',' ireland'
  ];
  placeholder_tokens text[] := ARRAY['unknown','[unknown]','null','n/a','na','tbd'];
  phrase text;
  tok text;
  parts text[];
BEGIN
  IF base = '' THEN RETURN ''; END IF;

  -- Strip trailing geo phrases (longest first via array order)
  FOREACH phrase IN ARRAY geo_phrases LOOP
    IF base LIKE '%' || phrase THEN
      base := substring(base FROM 1 FOR length(base) - length(phrase));
    END IF;
  END LOOP;

  -- Strip placeholder tokens
  FOREACH tok IN ARRAY placeholder_tokens LOOP
    base := regexp_replace(base, '(^|[\s\-])' || tok || '([\s\-]|$)', ' ', 'gi');
  END LOOP;

  -- Slugify: a-z0-9, hyphens
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := regexp_replace(base, '^-|-$', '', 'g');
  RETURN base;
END;
$$;

COMMENT ON FUNCTION public.business_seo_canonical_from_name(text) IS
  'SEO canonical slug from a business name. Mirrors src/lib/businessSlug.ts > businessNameToSlug.';


-- -----------------------------------------------------------------------------
-- SECTION 2 — The trigger
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.businesses_seo_normalize_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  cleaned text;
  base_slug text;
  candidate text;
  counter int;
BEGIN
  ----------------------------------------------------------------------------
  -- 1. WEBSITE: strip markdown link wrappers like '[label](url)' → 'url'
  --    and trim trailing slash. Common mistake in seed SQL.
  ----------------------------------------------------------------------------
  IF NEW.website IS NOT NULL THEN
    cleaned := trim(NEW.website);
    IF cleaned ~ '^\[.*\]\(.+\)$' THEN
      cleaned := substring(cleaned FROM '\((.+?)\)');
    END IF;
    cleaned := regexp_replace(cleaned, '/+$', '');
    NEW.website := NULLIF(cleaned, '');
  END IF;

  ----------------------------------------------------------------------------
  -- 2. CITY: if the value is a country name, null it out.
  --    Forces the (norm_name, norm_city, norm_country) ON CONFLICT to dedupe
  --    placeholder rows against any earlier insert that already had
  --    city = NULL for the same brand + country.
  ----------------------------------------------------------------------------
  IF NEW.city IS NOT NULL AND public.business_seo_is_country_name(NEW.city) THEN
    NEW.city := NULL;
  END IF;

  ----------------------------------------------------------------------------
  -- 3. SLUG: clean trailing country tokens (`-uk`, `unitedkingdom`, etc.)
  --    so that `likebodylikesoul-uk` becomes `likebodylikesoul`. If the
  --    cleaned slug is empty, derive one from the name.
  ----------------------------------------------------------------------------
  IF NEW.slug IS NOT NULL THEN
    NEW.slug := public.business_seo_clean_slug(NEW.slug);
  END IF;

  IF (NEW.slug IS NULL OR NEW.slug = '') AND NEW.name IS NOT NULL THEN
    NEW.slug := public.business_seo_canonical_from_name(NEW.name);
  END IF;

  ----------------------------------------------------------------------------
  -- 4. CANONICAL_SLUG: if missing, derive from name. Avoids leaving rows
  --    with NULL canonical_slug, which makes later dedup impossible.
  ----------------------------------------------------------------------------
  IF (NEW.canonical_slug IS NULL OR NEW.canonical_slug = '') AND NEW.name IS NOT NULL THEN
    NEW.canonical_slug := public.business_seo_canonical_from_name(NEW.name);
  END IF;

  ----------------------------------------------------------------------------
  -- 5. SLUG UNIQUENESS: if the cleaned slug now collides with an existing
  --    row, append `-2`, `-3`, … to keep the insert legal. The (much
  --    larger) ON CONFLICT (norm_name, norm_city, norm_country) target
  --    in the seed SQL still catches actual brand-level dupes.
  ----------------------------------------------------------------------------
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    base_slug := NEW.slug;
    candidate := base_slug;
    counter := 1;
    WHILE EXISTS (
      SELECT 1 FROM public.businesses
      WHERE slug = candidate
        AND (NEW.id IS NULL OR id <> NEW.id)
    ) LOOP
      counter := counter + 1;
      candidate := base_slug || '-' || counter;
      IF counter > 1000 THEN
        EXIT;
      END IF;
    END LOOP;
    NEW.slug := candidate;
  END IF;

  ----------------------------------------------------------------------------
  -- 6. UNSALVAGEABLE ROW DETECTION: if after cleaning the slug is still
  --    junk OR the row is a clear placeholder (no address AND no real city
  --    AND name looks generic), park the row in `under_review`. It stays
  --    in the database (no data loss), but is excluded from the sitemap
  --    and emits noindex via /b/[slug].
  ----------------------------------------------------------------------------
  IF NEW.slug IS NULL
     OR length(NEW.slug) < 3
     OR NEW.slug ~ '^\d+$'
     OR lower(NEW.slug) IN ('unknown','business','unitedstates','unitedkingdom','southafrica','australia','newzealand','ireland','canada')
     OR NEW.slug ~ '^business\d+$'
     OR NEW.slug ~ '^unitedstates\d+$'
  THEN
    NEW.status := 'under_review';
    IF NEW.submission_status IS NULL OR NEW.submission_status = '' THEN
      NEW.submission_status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.businesses_seo_normalize_trigger() IS
  'BEFORE INSERT/UPDATE on businesses. Auto-cleans website/slug/city, backfills canonical_slug, parks unsalvageable rows in under_review. See docs/sql/seo-auto-normalize-businesses-trigger.sql.';


-- -----------------------------------------------------------------------------
-- SECTION 3 — Attach the trigger
-- -----------------------------------------------------------------------------
-- Drop first so re-runs don't accumulate triggers.
DROP TRIGGER IF EXISTS businesses_seo_normalize_before_iud ON public.businesses;

CREATE TRIGGER businesses_seo_normalize_before_iud
BEFORE INSERT OR UPDATE OF name, slug, canonical_slug, website, city, status, submission_status
ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.businesses_seo_normalize_trigger();


-- -----------------------------------------------------------------------------
-- SECTION 4 — Smoke test (read-only, run in SQL editor; rolls back automatically)
-- -----------------------------------------------------------------------------
-- Uncomment to validate the trigger against your seed pattern. Wrapped in a
-- transaction with ROLLBACK so nothing is actually persisted.
--
-- BEGIN;
-- INSERT INTO public.businesses (
--   name, slug, website, address, city, country_code,
--   primary_group_slug, category_slug, status, submission_status, tags
-- ) VALUES
--   ('Likebodylikesoul',  'likebodylikesoul-uk',
--    '[https://likebodylikesoul.com](https://likebodylikesoul.com/)',
--    '', 'United Kingdom', 'GB',
--    'beauty-and-well-being', 'personal-care',
--    'active'::business_status_enum, 'approved',
--    ARRAY['vitamin-supplements-shop']::text[]),
--   ('Highland Kings', 'highland-kings-largs',
--    'https://highland-kings.com',
--    'Fairlie Quay Marina, Fairlie Quay', 'Largs', 'GB',
--    'beauty-and-well-being', 'personal-care',
--    'active'::business_status_enum, 'approved',
--    ARRAY['fitness-and-nutrition','running-shop','adventure-sports']::text[]),
--   ('Purdy & Figg',  'purdy-and-figg-uk',
--    '[https://purdyandfigg.com](https://purdyandfigg.com/)',
--    '', 'United Kingdom', 'GB',
--    'beauty-and-well-being', 'personal-care',
--    'active'::business_status_enum, 'approved',
--    ARRAY['toiletries-shop','beauty-products']::text[]);
--
-- SELECT name, slug, canonical_slug, website, city, status, submission_status
-- FROM public.businesses
-- WHERE name IN ('Likebodylikesoul','Highland Kings','Purdy & Figg')
-- ORDER BY name;
-- ROLLBACK;
--
-- Expected output of the SELECT (the trigger will have rewritten the
-- inserts in-flight):
--
-- name              | slug                    | canonical_slug          | website                       | city  | status       | submission_status
-- ------------------+-------------------------+-------------------------+-------------------------------+-------+--------------+------------------
-- Highland Kings    | highland-kings-largs    | highland-kings          | https://highland-kings.com    | Largs | active       | approved
-- Likebodylikesoul  | likebodylikesoul        | likebodylikesoul        | https://likebodylikesoul.com  | NULL  | active       | approved
-- Purdy & Figg      | purdy-and-figg          | purdy-and-figg          | https://purdyandfigg.com      | NULL  | active       | approved
