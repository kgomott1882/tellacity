export const revalidate = 120;

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import CategoryClient from "./CategoryClient";
import { normalizeCountryCode } from "@/lib/country";
import { normalizeBusinessTags } from "@/lib/businessTags";
import { getCachedCategoryListingPage } from "@/lib/cachedCategoryListing";

type PageProps = {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string; country?: string }>;
};
const TAG_FETCH_LIMIT = 2000;
const GLOBAL_TAG_FALLBACK_LIMIT = 1000;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing for category page");
  }
  return createClient(url, key);
}

function toTagSlug(tagName: string): string {
  return tagName.trim().toLowerCase().replace(/\s+/g, "-");
}

function buildPopularTagsFromCounts(
  counts: Map<string, number>,
  minCount: number,
): Array<{ label: string; slug: string }> {
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
    .slice(0, 20)
    .map(([tag]) => ({
      label: tag
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      slug: toTagSlug(tag),
    }));
}

function pickTagsWithThresholdFallback(
  counts: Map<string, number>,
): Array<{ label: string; slug: string }> {
  const strict = buildPopularTagsFromCounts(counts, 3);
  if (strict.length > 0) return strict;
  const medium = buildPopularTagsFromCounts(counts, 2);
  if (medium.length > 0) return medium;
  return buildPopularTagsFromCounts(counts, 1);
}

function countryNameFromCode(code: string): string {
  return code === "US"
    ? "United States"
    : code === "GB"
      ? "United Kingdom"
      : code === "ZA"
        ? "South Africa"
        : code === "AU"
          ? "Australia"
          : code === "CA"
            ? "Canada"
            : code === "NZ"
              ? "New Zealand"
              : code === "IE"
                ? "Ireland"
                : code;
}

async function loadPopularTagsForCategory(
  supabase: ReturnType<typeof getSupabase>,
  safeCategorySlug: string,
  requestedCountry: string | undefined,
): Promise<Array<{ label: string; slug: string }>> {
  let popularTags: Array<{ label: string; slug: string }> = [];
  try {
    const countryFilter = requestedCountry
      ? normalizeCountryCode(requestedCountry)
      : null;
    const countryAliases =
      countryFilter === "GB"
        ? ["GB", "UK", "GBR"]
        : countryFilter
          ? [countryFilter]
          : null;

    let tagsQuery = supabase
      .from("businesses")
      .select("tags")
      .eq("status", "active")
      .eq("category_slug", safeCategorySlug)
      .limit(TAG_FETCH_LIMIT);

    if (countryAliases && countryAliases.length > 0) {
      tagsQuery = tagsQuery.in("country_code", countryAliases);
    }

    const { data: tagRows, error: tagError } = await tagsQuery;
    if (!tagError && Array.isArray(tagRows) && tagRows.length > 0) {
      const counts = new Map<string, number>();
      for (const row of tagRows as Array<{ tags: unknown }>) {
        const tags = normalizeBusinessTags(row.tags);
        for (const tag of tags) {
          const normalized = String(tag ?? "").trim().toLowerCase();
          if (!normalized) continue;
          counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        }
      }
      popularTags = pickTagsWithThresholdFallback(counts);
    }

    if (popularTags.length === 0) {
      const { data: globalRows, error: globalError } = await supabase
        .from("businesses")
        .select("tags")
        .eq("status", "active")
        .limit(GLOBAL_TAG_FALLBACK_LIMIT);
      if (!globalError && Array.isArray(globalRows) && globalRows.length > 0) {
        const globalCounts = new Map<string, number>();
        for (const row of globalRows as Array<{ tags: unknown }>) {
          const tags = normalizeBusinessTags(row.tags);
          for (const tag of tags) {
            const normalized = String(tag ?? "").trim().toLowerCase();
            if (!normalized) continue;
            globalCounts.set(normalized, (globalCounts.get(normalized) ?? 0) + 1);
          }
        }
        popularTags = buildPopularTagsFromCounts(globalCounts, 1).slice(0, 10);
      }
    }
  } catch (e) {
    console.error("[category page] popular tags prefetch:", e);
  }

  return popularTags;
}

function countryAliasesForQuery(countryCode: string | null): string[] | null {
  if (!countryCode) return null;
  return countryCode === "GB" ? ["GB", "UK", "GBR"] : [countryCode];
}

async function loadCategoryCountsForMetadata(
  supabase: ReturnType<typeof getSupabase>,
  safeCategorySlug: string,
  requestedCountry: string | undefined,
): Promise<{ businessCount: number; reviewCount: number }> {
  const normalizedCountry = requestedCountry
    ? normalizeCountryCode(requestedCountry)
    : null;
  const aliases = countryAliasesForQuery(normalizedCountry);

  let countQuery = supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("category_slug", safeCategorySlug);
  if (aliases && aliases.length > 0) {
    countQuery = countQuery.in("country_code", aliases);
  }

  const { count } = await countQuery;
  const businessCount = count ?? 0;
  if (businessCount <= 0) {
    return { businessCount: 0, reviewCount: 0 };
  }

  const PAGE = 1000;
  let reviewCount = 0;
  let offset = 0;
  while (true) {
    let reviewsQuery = supabase
      .from("businesses")
      .select("review_count")
      .eq("status", "active")
      .eq("category_slug", safeCategorySlug)
      .range(offset, offset + PAGE - 1);
    if (aliases && aliases.length > 0) {
      reviewsQuery = reviewsQuery.in("country_code", aliases);
    }

    const { data, error } = await reviewsQuery;
    if (error || !Array.isArray(data) || data.length === 0) {
      break;
    }

    for (const row of data as Array<{ review_count?: number | null }>) {
      reviewCount += Number(row.review_count ?? 0) || 0;
    }

    if (data.length < PAGE) {
      break;
    }
    offset += PAGE;
  }

  return { businessCount, reviewCount };
}

// ----------------------------
// METADATA (Next 16 compliant)
// ----------------------------
export async function generateMetadata(props: {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { category_slug } = await props.params;
  const safeCategorySlug = category_slug.trim().toLowerCase();

  const searchParams = (await (props.searchParams ?? Promise.resolve({}))) as {
    page?: string;
    country?: string;
  };

  const pageNum = Math.max(
    1,
    parseInt(String(searchParams.page ?? "1"), 10) || 1
  );
  const countryCode = normalizeCountryCode(searchParams?.country);
  const countryName = countryNameFromCode(countryCode);
  const supabase = getSupabase();

  let categoryName: string | null = null;

  if (safeCategorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", safeCategorySlug)
      .maybeSingle();

    categoryName = data?.name ?? null;
  }

  const fallbackTitle = safeCategorySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const categoryNameFinal = categoryName ?? fallbackTitle;
  const popularTags = await loadPopularTagsForCategory(
    supabase,
    safeCategorySlug,
    searchParams?.country,
  );
  const { reviewCount, businessCount } = await loadCategoryCountsForMetadata(
    supabase,
    safeCategorySlug,
    searchParams?.country,
  );
  const topTags = popularTags
    .slice(0, 5)
    .map((item) => item.label.toLowerCase())
    .join(", ");

  const countLabel =
    reviewCount > 0
      ? `${reviewCount.toLocaleString()} Reviews`
      : `${businessCount.toLocaleString()} Companies`;
  const baseTitle = `Best ${categoryNameFinal} Companies in ${countryName} (${countLabel})`;
  const metaTitle = pageNum > 1 ? `${baseTitle} – Page ${pageNum}` : baseTitle;
  const description = topTags
    ? `Browse verified customer reviews for ${categoryNameFinal} companies in ${countryName}. Explore top providers including ${topTags}. Compare ratings, read real experiences, and find trusted businesses.`
    : `Browse verified customer reviews for ${categoryNameFinal} companies in ${countryName}. Compare ratings, read real experiences, and find trusted businesses.`;

  return {
    title: metaTitle,
    description,
    alternates: {
      canonical: `https://tellacity.com/categories/${safeCategorySlug}`,
    },
  };
}

// ----------------------------
// PAGE (Next 16 compliant)
// ----------------------------
export default async function Page(props: PageProps) {
  const { category_slug } = await props.params;
  const safeCategorySlug = category_slug.trim().toLowerCase();
  const searchParams = (await (props.searchParams ?? Promise.resolve({}))) as {
    page?: string;
    country?: string;
  };
  const pageNum = Math.max(
    1,
    parseInt(String(searchParams.page ?? "1"), 10) || 1
  );
  const supabase = getSupabase();

  const { data: category } = await supabase
    .from("categories")
    .select("slug,name,group_slug")
    .eq("slug", safeCategorySlug)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const categoryName =
    (category.name ?? "").trim() ||
    safeCategorySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  const countryCode = normalizeCountryCode(searchParams?.country);
  const countryName = countryNameFromCode(countryCode);

  let businesses: unknown[] = [];
  let companyCount = 0;
  let hasNextPage = false;
  try {
    const pack = await getCachedCategoryListingPage(
      safeCategorySlug,
      countryCode,
      pageNum - 1,
      0,
    );
    businesses = pack.rows as unknown[];
    companyCount = pack.totalCount;
    hasNextPage = pack.hasNext;
  } catch (e) {
    console.error("[category page] prefetch:", e);
  }

  const popularTags = await loadPopularTagsForCategory(
    supabase,
    safeCategorySlug,
    searchParams?.country,
  );

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs text-[#1FAF9E]">
            Categories <span className="mx-1">›</span> Business Services <span className="mx-1">›</span> {categoryName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
            Best {categoryName} companies in {countryName}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Find the best {categoryName} companies in {countryName}. Compare ratings, read real customer reviews, and choose trusted providers based on real experiences.
          </p>
          <div style={{ marginTop: "10px" }}>
            <a
              href={`/best/${countryCode.toLowerCase()}/${safeCategorySlug}`}
              style={{
                fontSize: "13px",
                color: "#1FAF9E",
                textDecoration: "none",
              }}
            >
              View best {categoryName} companies in {countryName} →
            </a>
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-4 mt-2">
            <span>• Ranked by TrustScore</span>
            <span>• Filter by rating &amp; country</span>
            <span>• Read &amp; share experiences</span>
          </div>
        </div>
      </section>

      <CategoryClient
        categorySlug={safeCategorySlug}
        initialCountryCode={countryCode}
        businesses={businesses}
        companyCount={companyCount}
        hasNextPage={hasNextPage}
        popularTags={popularTags}
      />
    </>
  );
}
