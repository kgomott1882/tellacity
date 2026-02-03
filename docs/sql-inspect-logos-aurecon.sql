-- =============================================================================
-- LOGO INSPECTION: Aurecon Construction Services (and all logo-related data)
-- Run in Supabase SQL Editor. Run each query (1, 2, 4, 5) in turn and paste ALL
-- result sets back so we can see what is wired for logos.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Business row(s) for "Aurecon" – manual logo + website (domain for edge function)
-- -----------------------------------------------------------------------------
SELECT
  'businesses' AS source,
  id,
  name,
  slug,
  logo_url,                    -- manual upload (primary for app)
  website,                      -- raw URL
  website_display,              -- display URL (app uses this first for domain)
  coalesce(website_display, website) AS domain_for_edge_function,
  status,
  category_slug
FROM public.businesses
WHERE lower(name) LIKE '%aurecon%'
   OR lower(slug) LIKE '%aurecon%';

-- -----------------------------------------------------------------------------
-- 2) Same columns for ALL businesses that have a website (first 20)
-- -----------------------------------------------------------------------------
SELECT
  id,
  name,
  slug,
  logo_url,
  website,
  website_display,
  coalesce(website_display, website) AS domain_for_edge_function
FROM public.businesses
WHERE coalesce(status, 'active') = 'active'
  AND (coalesce(website_display, website, '') <> '')
ORDER BY name
LIMIT 20;

-- 3) (Optional) If you have view home_feed_v1, run this in a NEW query tab:
--    SELECT business_slug, resolved_logo_url, business_name, website
--    FROM public.home_feed_v1
--    WHERE lower(business_name) LIKE '%aurecon%' OR lower(business_slug) LIKE '%aurecon%'
--    LIMIT 5;

-- -----------------------------------------------------------------------------
-- 4) Column check: does public.businesses have logo_url and website columns?
-- -----------------------------------------------------------------------------
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name IN ('logo_url', 'website', 'website_display', 'name', 'slug')
ORDER BY ordinal_position;

-- -----------------------------------------------------------------------------
-- 5) RPC output for construction-services category (Aurecon if in that category)
-- -----------------------------------------------------------------------------
SELECT *
FROM public.get_top_businesses_for_category_global(
  'construction-services',  -- category slug
  NULL,                     -- p_country_code
  NULL,                     -- p_min_rating
  20,
  0
)
WHERE lower(name) LIKE '%aurecon%';
