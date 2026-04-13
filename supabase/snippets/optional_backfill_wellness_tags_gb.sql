-- OPTIONAL: Run in Supabase SQL Editor only if you want to persist Google-style
-- keyword tags on specific businesses (edit slugs + json array per row).
--
-- Prefer: run app migration `20260715130000_rpc_tags_fallback_secondary_slugs.sql`
-- so empty `tags` rows still show chips from `secondary_category_slugs`.
--
-- This snippet is for businesses that have NEITHER tags nor secondary slugs
-- but you have a curated list from Google Maps / manual research.

-- Example: set tags for one business by slug (GB / wellness-and-spa).
-- Replace slug and json array with your data.

/*
update public.businesses
set tags = '[
  "Skin care clinic",
  "Massage spa",
  "Facial spa",
  "Hair removal service",
  "Beauty salon"
]'::jsonb
where lower(trim(slug)) = lower(trim('111-harley-st'))
  and lower(trim(coalesce(country_code,''))) in ('gb','uk')
  and lower(trim(coalesce(category_slug,''))) = 'wellness-and-spa';
*/

-- Bulk: only rows that still have no tags and no secondary slugs (optional pattern).
/*
update public.businesses b
set tags = '["Skin care clinic","Massage spa","Facial spa","Hair removal service","Beauty salon"]'::jsonb
where lower(trim(b.category_slug)) = 'wellness-and-spa'
  and public.normalize_country_code_home(b.country_code) = 'GB'
  and (b.tags is null or b.tags = '[]'::jsonb or jsonb_array_length(coalesce(b.tags::jsonb, '[]'::jsonb)) = 0)
  and (b.secondary_category_slugs is null or cardinality(b.secondary_category_slugs) = 0);
*/

-- Inspect before updating:
-- select id, slug, name, country_code, category_slug, tags, secondary_category_slugs
-- from public.businesses
-- where lower(trim(category_slug)) = 'wellness-and-spa'
--   and public.normalize_country_code_home(country_code) = 'GB'
-- order by name
-- limit 50;
