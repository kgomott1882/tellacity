-- Reset logo_fetch_failed in small batches (Supabase SQL Editor times out on full-table UPDATE).
-- Run the same block repeatedly until "UPDATE 0" / no rows affected.
--
-- Prefer: skip this entirely after script change — npm run process:logos retries
-- logo_fetch_failed = true rows automatically once set_business_logo_from_service exists.

-- Batch A: Logo.dev URLs only (usually smaller / faster)
WITH batch AS (
  SELECT id
  FROM public.businesses
  WHERE logo_fetch_failed = true
    AND logo_url LIKE 'https://img.logo.dev%'
  LIMIT 1000
)
UPDATE public.businesses b
SET logo_fetch_failed = false
FROM batch
WHERE b.id = batch.id;

-- Batch B: NULL logo_url (run repeatedly; keep LIMIT low)
-- WITH batch AS (
--   SELECT id
--   FROM public.businesses
--   WHERE logo_fetch_failed = true
--     AND logo_url IS NULL
--   LIMIT 1000
-- )
-- UPDATE public.businesses b
-- SET logo_fetch_failed = false
-- FROM batch
-- WHERE b.id = batch.id;

-- Monitor progress (optional)
-- SELECT
--   count(*) filter (where logo_fetch_failed) as still_failed,
--   count(*) filter (where logo_url is null) as null_logo,
--   count(*) filter (where logo_url like 'https://img.logo.dev%') as logo_dev
-- FROM public.businesses;
