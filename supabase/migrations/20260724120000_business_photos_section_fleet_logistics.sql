-- =========================================================================
-- Add "Fleet & Logistics" as a new built-in photo section for every business.
-- Safe to re-run: uses ON CONFLICT DO NOTHING on (business_id, slug).
-- =========================================================================

insert into public.business_photo_sections
  (business_id, slug, title, is_builtin, is_enabled, sort_order)
select
  b.id,
  'fleet-logistics'::text as slug,
  'Fleet & Logistics'::text as title,
  true as is_builtin,
  true as is_enabled,
  60 as sort_order
from public.businesses b
on conflict (business_id, slug) do nothing;
