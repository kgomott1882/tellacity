import { normalizeCountryCode } from "@/lib/country";

export type CategoriesCountryMeta = {
  code: string;
  label: string;
  seoLabel: string;
  /** H1 and title phrasing (e.g. "United States" without leading "the"). */
  headingName: string;
};

const COUNTRY_META: Record<string, CategoriesCountryMeta> = {
  GB: {
    code: "GB",
    label: "Great Britain",
    seoLabel: "Great Britain",
    headingName: "Great Britain",
  },
  US: {
    code: "US",
    label: "the United States",
    seoLabel: "the United States",
    headingName: "United States",
  },
  ZA: {
    code: "ZA",
    label: "South Africa",
    seoLabel: "South Africa",
    headingName: "South Africa",
  },
  AU: {
    code: "AU",
    label: "Australia",
    seoLabel: "Australia",
    headingName: "Australia",
  },
  CA: {
    code: "CA",
    label: "Canada",
    seoLabel: "Canada",
    headingName: "Canada",
  },
  NZ: {
    code: "NZ",
    label: "New Zealand",
    seoLabel: "New Zealand",
    headingName: "New Zealand",
  },
  IE: {
    code: "IE",
    label: "Ireland",
    seoLabel: "Ireland",
    headingName: "Ireland",
  },
};

const US_PAGE_TITLE = "Explore Categories in the United States | Tellacity";
const US_PAGE_DESCRIPTION =
  "Browse verified business categories in the United States on Tellacity and quickly find companies by industry, category, and trust signals.";

export function getCategoriesCountryMeta(
  countryParam?: string | null
): CategoriesCountryMeta {
  const code = normalizeCountryCode(countryParam ?? undefined);
  return COUNTRY_META[code] ?? COUNTRY_META.US;
}

export function categoriesPageUrl(countryCode: string) {
  return `https://tellacity.com/categories?country=${encodeURIComponent(countryCode)}`;
}

export function buildCategoriesMetadata(countryParam?: string | null) {
  const meta = getCategoriesCountryMeta(countryParam);
  const { code, seoLabel, headingName } = meta;
  const url = categoriesPageUrl(code);
  const title =
    code === "US"
      ? US_PAGE_TITLE
      : `Explore Categories in ${headingName} | Tellacity`;
  const description =
    code === "US"
      ? US_PAGE_DESCRIPTION
      : `Browse verified business categories in ${seoLabel} on Tellacity. Find companies by industry, compare trust signals, and discover real customer feedback.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Tellacity",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export function buildCategoriesJsonLd(countryParam?: string | null) {
  const meta = getCategoriesCountryMeta(countryParam);
  const { code, seoLabel, headingName } = meta;
  const url = categoriesPageUrl(code);
  const name =
    code === "US"
      ? US_PAGE_TITLE
      : `Explore Categories in ${headingName} | Tellacity`;
  const description =
    code === "US"
      ? US_PAGE_DESCRIPTION
      : `Browse verified business categories in ${seoLabel} on Tellacity. Find companies by industry, compare trust signals, and discover real customer feedback.`;
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://tellacity.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Categories",
          item: url,
        },
      ],
    },
  };
}

/** One-line descriptions for top-level category groups (matched by slug substring). */
export const GROUP_DESCRIPTION_MATCHERS: { match: string; description: string }[] = [
  {
    match: "animal",
    description: "Pet care, services, stores, and animal-related businesses.",
  },
  {
    match: "beauty",
    description: "Salons, gyms, wellness, and self-care services.",
  },
  {
    match: "well-being",
    description: "Salons, gyms, wellness, and self-care services.",
  },
  {
    match: "wellbeing",
    description: "Salons, gyms, wellness, and self-care services.",
  },
  {
    match: "business-service",
    description: "Operational, professional, and B2B support services.",
  },
  {
    match: "construction",
    description: "Building, industrial, and production businesses.",
  },
  {
    match: "manufacturing",
    description: "Building, industrial, and production businesses.",
  },
  {
    match: "education",
    description: "Schools, training providers, and learning services.",
  },
  {
    match: "training",
    description: "Schools, training providers, and learning services.",
  },
  {
    match: "electronics",
    description: "Technology retailers, IT services, and digital products.",
  },
  {
    match: "technology",
    description: "Technology retailers, IT services, and digital products.",
  },
  {
    match: "events",
    description: "Venues, planners, entertainment, and leisure experiences.",
  },
  {
    match: "entertainment",
    description: "Venues, planners, entertainment, and leisure experiences.",
  },
  {
    match: "food",
    description: "Food producers, distributors, and related retailers.",
  },
  {
    match: "beverage",
    description: "Food producers, distributors, and related retailers.",
  },
  {
    match: "tobacco",
    description: "Food producers, distributors, and related retailers.",
  },
  {
    match: "health",
    description: "Clinics, pharmacies, dental, and medical services.",
  },
  {
    match: "medical",
    description: "Clinics, pharmacies, dental, and medical services.",
  },
  {
    match: "hobbies",
    description: "Craft shops, hobby retailers, and creative services.",
  },
  {
    match: "crafts",
    description: "Craft shops, hobby retailers, and creative services.",
  },
  {
    match: "home-garden",
    description: "Home improvement, décor, and garden suppliers.",
  },
  {
    match: "home",
    description: "Home improvement, repairs, and household services.",
  },
  {
    match: "legal",
    description: "Law firms, advisory services, and compliance support.",
  },
  {
    match: "government",
    description: "Public agencies, civic services, and local administration.",
  },
  {
    match: "media",
    description: "Publishers, broadcasters, and content businesses.",
  },
  {
    match: "publishing",
    description: "Publishers, broadcasters, and content businesses.",
  },
  {
    match: "money",
    description: "Banks, lenders, insurers, and financial advisors.",
  },
  {
    match: "insurance",
    description: "Banks, lenders, insurers, and financial advisors.",
  },
  {
    match: "public",
    description: "Community services, utilities access, and local providers.",
  },
  {
    match: "local-service",
    description: "Community services, utilities access, and local providers.",
  },
  {
    match: "restaurant",
    description: "Restaurants, cafés, bars, and dining venues.",
  },
  {
    match: "bars",
    description: "Restaurants, cafés, bars, and dining venues.",
  },
  {
    match: "shopping",
    description: "Retail stores, fashion, and consumer goods.",
  },
  {
    match: "fashion",
    description: "Retail stores, fashion, and consumer goods.",
  },
  {
    match: "sport",
    description: "Gyms, clubs, equipment, and sports services.",
  },
  {
    match: "travel",
    description: "Hotels, airlines, agencies, and activities.",
  },
  {
    match: "vacation",
    description: "Hotels, airlines, agencies, and activities.",
  },
  {
    match: "utilities",
    description: "Energy, water, telecom, and essential service providers.",
  },
  {
    match: "vehicle",
    description: "Dealers, garages, transport, and mobility services.",
  },
  {
    match: "transport",
    description: "Dealers, garages, transport, and mobility services.",
  },
];

export function getGroupDescription(groupSlug: string): string | null {
  const lower = (groupSlug ?? "").toLowerCase();
  const found = GROUP_DESCRIPTION_MATCHERS.find(({ match }) =>
    lower.includes(match)
  );
  return found?.description ?? null;
}

export type TopSectorChip = {
  label: string;
  groupSlugMatchers: string[];
};

export const TOP_SECTOR_CHIPS: TopSectorChip[] = [
  {
    label: "Home and services",
    groupSlugMatchers: ["home-services", "home-garden", "home"],
  },
  {
    label: "Health and well-being",
    groupSlugMatchers: ["health", "medical", "beauty", "well-being", "wellbeing"],
  },
  {
    label: "Food and restaurants",
    groupSlugMatchers: ["restaurant", "food", "beverage", "bars"],
  },
  {
    label: "Travel and transport",
    groupSlugMatchers: ["travel", "vacation", "vehicle", "transport"],
  },
  {
    label: "Business and technology",
    groupSlugMatchers: ["business-service", "electronics", "technology"],
  },
  {
    label: "Shopping and fashion",
    groupSlugMatchers: ["shopping", "fashion", "retail"],
  },
];

export function resolveTopSectorHref(
  chip: TopSectorChip,
  groups: { slug: string }[],
  countryQuerySuffix: string
): string | null {
  const group = groups.find((g) =>
    chip.groupSlugMatchers.some((m) => g.slug.toLowerCase().includes(m))
  );
  if (!group?.slug) return null;
  return `/categories/${encodeURIComponent(group.slug.trim())}${countryQuerySuffix}`;
}

export const NEED_HELP_LINKS = [
  { href: "/suggest-business", label: "Suggest a missing business" },
  { href: "/for-business", label: "Tellacity for Business" },
  { href: "/reputation-platform", label: "Reputation Management Platform" },
  { href: "/safety-trust", label: "Safety & Trust" },
] as const;

export const RELATED_LINKS = [
  { href: "/about", label: "About Tellacity" },
  { href: "/for-business", label: "Tellacity for Business" },
  { href: "/reputation-platform", label: "Reputation Management Platform" },
  { href: "/write-review", label: "Write a review" },
  { href: "/suggest-business", label: "Suggest a missing business" },
  { href: "/resources", label: "Resources" },
  { href: "/blog", label: "Blog" },
  { href: "/help-center", label: "Help Center" },
  { href: "/safety-trust", label: "Safety & Trust" },
  { href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
] as const;
