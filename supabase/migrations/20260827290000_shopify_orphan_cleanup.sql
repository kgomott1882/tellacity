-- Remove Shopify rows that are not real connections (no token or no business link).
-- Prevents the integrations list from showing Connected while manage/status say otherwise.

DELETE FROM public.shopify_integrations
WHERE access_token IS NULL
   OR btrim(access_token) = '';

DELETE FROM public.shopify_integrations
WHERE business_id IS NULL;
