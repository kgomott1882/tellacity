-- =============================================================================
-- Backfill website_display with clean domain (e.g. aurecongroup.com)
-- Logo.dev and the edge function need the domain, not the full URL.
-- Run in Supabase SQL Editor.
-- =============================================================================

-- 1) Preview: which rows will get website_display set (domain extracted from website)
SELECT
  id,
  name,
  slug,
  website AS website_before,
  website_display AS website_display_before,
  lower(
    regexp_replace(
      regexp_replace(
        coalesce(website, ''),
        '^https?://',
        '',
        'i'
      ),
      '^www\.',
      '',
      'i'
    )
  ) AS domain_extracted
FROM public.businesses
WHERE coalesce(status, 'active') = 'active'
  AND (website IS NOT NULL AND trim(website) <> '')
  AND (website_display IS NULL OR trim(website_display) = '');

-- 2) Update: set website_display = clean domain where it's null/empty
--    (domain = strip protocol and www, e.g. https://www.aurecongroup.com -> aurecongroup.com)
UPDATE public.businesses
SET website_display = lower(
  regexp_replace(
    split_part(
      regexp_replace(trim(coalesce(website, '')), '^https?://', '', 'i'),
      '/',
      1
    ),
    '^www\.',
    '',
    'i'
  )
)
WHERE coalesce(status, 'active') = 'active'
  AND (website IS NOT NULL AND trim(website) <> '')
  AND (website_display IS NULL OR trim(website_display) = '');

-- 3) Verify Aurecon: should now have website_display = 'aurecongroup.com'
SELECT id, name, slug, logo_url, website, website_display
FROM public.businesses
WHERE lower(name) LIKE '%aurecon%';
