export const dynamic = "force-static";

import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { normalizeBusinessTags } from "@/lib/businessTags";
const PAGE_SIZE = 1000;
const MAX_TAG_URLS = 5000;
const MIN_TAG_USAGE = 3;
const SUPPORTED_BEST_COUNTRIES = new Set([
  "US",
  "GB",
  "ZA",
  "AU",
  "CA",
  "NZ",
  "IE",
]);

function toTagSlug(tagName: string): string {
  return tagName.trim().toLowerCase().replace(/\s+/g, "-");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { count } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const sitemaps: MetadataRoute.Sitemap = [];

  for (let i = 1; i <= totalPages; i++) {
    sitemaps.push({
      url: `https://tellacity.com/business-sitemaps/${i}.xml`,
      lastModified: new Date(),
    });
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .not("slug", "is", null);
  const existingCategorySlugs = new Set(
    (categories ?? [])
      .map((row) => String((row as { slug?: string }).slug ?? "").trim().toLowerCase())
      .filter(Boolean),
  );

  const tagUsageCounts = new Map<string, number>();
  const bestPagePairs = new Set<string>();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("businesses")
      .select("tags,category_slug,country_code")
      .eq("status", "active")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      break;
    }

    for (const row of data as Array<{ tags: unknown; category_slug?: unknown; country_code?: unknown }>) {
      const normalizedTags = normalizeBusinessTags(row.tags);
      for (const tag of normalizedTags) {
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) {
          continue;
        }
        tagUsageCounts.set(
          normalizedTag,
          (tagUsageCounts.get(normalizedTag) ?? 0) + 1,
        );
      }

      const categorySlug = String(row.category_slug ?? "").trim().toLowerCase();
      if (!categorySlug || !existingCategorySlugs.has(categorySlug)) {
        continue;
      }
      const rawCountry = String(row.country_code ?? "").trim().toUpperCase();
      const bestCountry = rawCountry === "UK" ? "GB" : rawCountry;
      if (!SUPPORTED_BEST_COUNTRIES.has(bestCountry)) {
        continue;
      }
      bestPagePairs.add(`${bestCountry}|${categorySlug}`);
    }

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  const tagPages: MetadataRoute.Sitemap = [];
  const emittedTagSlugs = new Set<string>();
  for (const [tagName, usageCount] of tagUsageCounts) {
    if (usageCount < MIN_TAG_USAGE) {
      continue;
    }
    const tagSlug = toTagSlug(tagName);
    if (!tagSlug || emittedTagSlugs.has(tagSlug)) {
      continue;
    }
    emittedTagSlugs.add(tagSlug);
    tagPages.push({
      url: `https://tellacity.com/tags/${tagSlug}`,
    });
    if (tagPages.length >= MAX_TAG_URLS) {
      break;
    }
  }

  const bestPages: MetadataRoute.Sitemap = Array.from(bestPagePairs)
    .map((pair) => {
      const [countryCode, categorySlug] = pair.split("|");
      return {
        url: `https://tellacity.com/best/${countryCode.toLowerCase()}/${categorySlug}`,
      };
    })
    .sort((a, b) => a.url.localeCompare(b.url));

  return [
    {
      url: "https://tellacity.com",
    },
    {
      url: "https://tellacity.com/reviews",
    },
    {
      url: "https://tellacity.com/for-business",
    },
    {
      url: "https://tellacity.com/categories",
    },
    {
      url: "https://tellacity.com/companies",
    },
    ...tagPages,
    ...bestPages,
    ...sitemaps,
  ];
}
