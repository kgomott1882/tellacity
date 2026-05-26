type CategoryBusinessListItem = {
  name: string;
  slug: string;
};

export type CategoryPageJsonLdInput = {
  categoryName: string;
  categorySlug: string;
  categoryGroupName: string;
  categoryGroupSlug: string;
  countryCode: string;
  countryName: string;
  businesses: CategoryBusinessListItem[];
  totalCount: number;
};

function categoryPageUrl(categorySlug: string, countryCode: string): string {
  return `https://tellacity.com/categories/${categorySlug}?country=${countryCode.toUpperCase()}`;
}

export function buildCategoryPageJsonLdScripts(
  input: CategoryPageJsonLdInput,
): Record<string, unknown>[] {
  const pageUrl = categoryPageUrl(input.categorySlug, input.countryCode);
  const groupUrl = input.categoryGroupSlug
    ? `https://tellacity.com/categories/${input.categoryGroupSlug}`
    : "https://tellacity.com/categories";

  const breadcrumbItems = [
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
      item: "https://tellacity.com/categories",
    },
  ];

  if (input.categoryGroupSlug && input.categoryGroupName) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: input.categoryGroupName,
      item: groupUrl,
    });
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 4,
      name: input.categoryName,
      item: pageUrl,
    });
  } else {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: input.categoryName,
      item: pageUrl,
    });
  }

  const listBusinesses = input.businesses
    .filter((b) => b.name && b.slug)
    .slice(0, 25);

  const collectionPage: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Best ${input.categoryName} in ${input.countryName} | Tellacity`,
    description: `Browse the best ${input.categoryName} providers in ${input.countryName} on Tellacity.`,
    url: pageUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    },
  };

  const itemList: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${input.categoryName} providers in ${input.countryName}`,
    numberOfItems: input.totalCount > 0 ? input.totalCount : listBusinesses.length,
    itemListElement: listBusinesses.map((business, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: business.name,
        url: `https://tellacity.com/b/${business.slug.trim().toLowerCase()}`,
      },
    })),
  };

  const howTo: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How category listings work on Tellacity",
    step: [
      {
        "@type": "HowToStep",
        name: "Ranked by TrustScore",
        text: "Listings are ordered by TrustScore, which summarises verified reviews, response behaviour, and policy-compliance signals.",
      },
      {
        "@type": "HowToStep",
        name: "Filter by rating & country",
        text: "Use filters to narrow results by rating band and country so you can see only the most relevant providers.",
      },
      {
        "@type": "HowToStep",
        name: "Read & share experiences",
        text: "Click into a business to read detailed reviews or write your own experience to help other customers decide.",
      },
    ],
  };

  return [collectionPage, itemList, howTo];
}
