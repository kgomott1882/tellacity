/** Homepage “Find businesses by category” marquee — `slug` must match `public.categories.slug`. */

export type MarqueeCategorySource = { label: string; slug: string };

/**
 * Target DB category names (for ops / verification). Slugs below must match `categories.slug`.
 * Shopping Store → Grocery Stores & Markets
 * Bicycle Store → Bicycles
 * Shoe Store → Clothing & Underwear
 * Mortgage Broker → Real Estate
 * Garden Center → Home & Garden Services
 * Energy Supplier → Energy & Heating
 */

export const LOOKING_FOR_CATEGORIES: MarqueeCategorySource[] = [
  { label: "Banking", slug: "banking" },
  { label: "Travel Agencies", slug: "travel-agencies" },
  { label: "Cars & Trucks", slug: "cars-and-trucks" },
  { label: "Furniture Stores", slug: "furniture-stores" },
  { label: "Jewelry & Watches", slug: "jewelry-and-watches" },
  { label: "Clothing & Underwear", slug: "clothing-and-underwear" },
  { label: "Appliances & Electronics", slug: "appliances-and-electronics" },
  { label: "Fitness & Gyms", slug: "fitness-and-gyms" },
];

/** Display-only niches; each maps to an existing catalog slug. */
export const ADDITIONAL_MARQUEE_CATEGORIES: MarqueeCategorySource[] = [
  { label: "Pet Store", slug: "retail" },
  { label: "Energy Supplier", slug: "energy-and-heating" },
  { label: "Real Estate Agents", slug: "banking-and-money" },
  { label: "Insurance Agency", slug: "insurance" },
  { label: "Bedroom Furniture Store", slug: "furniture-stores" },
  { label: "Activewear Store", slug: "clothing-and-underwear" },
  { label: "Women's Clothing Store", slug: "clothing-and-underwear" },
  { label: "Men's Clothing Store", slug: "clothing-and-underwear" },
  { label: "Shopping Store", slug: "grocery-stores-and-markets" },
  { label: "Bicycle Store", slug: "bicycles" },
  { label: "Shoe Store", slug: "clothing-and-underwear" },
  { label: "Mortgage Broker", slug: "real-estate" },
  { label: "Appliance Store", slug: "appliances-and-electronics" },
  { label: "Cosmetics Store", slug: "jewelry-and-watches" },
  { label: "Electronics Store", slug: "appliances-and-electronics" },
  { label: "Garden Center", slug: "home-and-garden-services" },
  { label: "Travel Agency", slug: "travel-agencies" },
];

/** 24 tiles: 8 primary + 16 additional (shared slugs OK). */
export const HOME_MARQUEE_CATEGORY_ITEMS: MarqueeCategorySource[] = [
  ...LOOKING_FOR_CATEGORIES,
  ...ADDITIONAL_MARQUEE_CATEGORIES.slice(0, 16),
];

export type HomeMarqueeCategoryCard = {
  id: string;
  name: string;
  slug: string;
};

export function buildMarqueeCategoryCards(
  items: MarqueeCategorySource[]
): HomeMarqueeCategoryCard[] {
  return items.map((c, i) => ({
    id: `marquee-${c.slug}-${i}-${c.label.replace(/\s+/g, "-")}`,
    name: c.label,
    slug: c.slug.trim().toLowerCase(),
  }));
}

/**
 * Prefer DB-backed names when available; keeps label order from `items`.
 */
export function enrichMarqueeItemsWithDbNames(
  items: MarqueeCategorySource[],
  rows: { slug: string | null; name: string | null }[] | null | undefined
): MarqueeCategorySource[] {
  const nameBySlug = new Map<string, string>();
  for (const r of rows ?? []) {
    const s = (r.slug ?? "").trim().toLowerCase();
    const n = (r.name ?? "").trim();
    if (s && n) nameBySlug.set(s, n);
  }
  return items.map((item) => {
    const slug = item.slug.trim().toLowerCase();
    const dbName = nameBySlug.get(slug);
    return dbName ? { label: dbName, slug } : { ...item, slug };
  });
}
