import {
  COUNTRY_LABELS,
  countryPathSegment,
  toStorageCountryCode,
  type SupportedCountryCode,
} from "@/lib/seoCountries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

export function countryInPhrase(
  code: SupportedCountryCode,
  label: string = COUNTRY_LABELS[code],
): string {
  if (code === "UK") return "the United Kingdom";
  if (code === "US") return "the United States";
  return label;
}

export function companiesCountryPageUrl(
  code: SupportedCountryCode,
): string {
  const segment = countryPathSegment(code);
  const storageCode = toStorageCountryCode(code);
  return `${BASE_URL}/companies/${segment}?country=${storageCode}`;
}

export function buildCompaniesCountryPageJsonLd(
  code: SupportedCountryCode,
): Record<string, unknown>[] {
  const label = COUNTRY_LABELS[code];
  const phrase = countryInPhrase(code, label);
  const pageUrl = companiesCountryPageUrl(code);
  const segment = countryPathSegment(code);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const storageCode = toStorageCountryCode(code);

  const collectionPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Browse Companies in ${phrase} | Tellacity`,
    description: `Browse companies in ${phrase} alphabetically and explore verified customer reviews on Tellacity.`,
    url: pageUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${BASE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Companies",
          item: `${BASE_URL}/companies`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: label,
          item: pageUrl,
        },
      ],
    },
  };

  const itemList: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Alphabetical company directory in ${phrase}`,
    numberOfItems: letters.length,
    itemListElement: letters.map((letter, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: letter,
      url: `${BASE_URL}/companies/${segment}/${letter.toLowerCase()}?country=${storageCode}`,
    })),
  };

  return [collectionPage, itemList];
}
