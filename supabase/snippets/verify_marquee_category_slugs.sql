-- Optional: confirm homepage marquee slugs exist in public.categories.
-- If a row is missing, add/update the category in your catalog (or adjust slugs in src/lib/homeMarqueeCategories.ts).

select slug, name, group_slug
from public.categories
where slug in (
  'grocery-stores-and-markets',
  'bicycles',
  'clothing-and-underwear',
  'real-estate',
  'home-and-garden-services',
  'energy-and-heating'
)
order by slug;

-- If names match but slug differs, use this to discover actual slugs:
-- select slug, name from public.categories
-- where name ilike any (array[
--   '%grocery%', '%bicycle%', '%real estate%', '%garden%', '%energy%', '%heating%'
-- ]);
