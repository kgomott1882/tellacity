export const dynamic = "force-dynamic";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import CategoryClient from "./CategoryClient";
import { normalizeCountryCode } from "@/lib/country";
import { normalizeBusinessTags, mergeTagsForDisplay } from "@/lib/businessTags";
import { getCachedCategoryListingPage } from "@/lib/cachedCategoryListing";
import type { CategoryBusinessRow } from "@/lib/categoryListingQueries";
import { CATEGORY_LISTING_PAGE_SIZE } from "@/lib/categoryListingPageSize";

type PageProps = {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string; country?: string }>;
};
/** Cap tag scan per request — avoids heavy reads on huge categories. */
const TAG_FETCH_LIMIT = 500;
const GLOBAL_TAG_FALLBACK_LIMIT = 400;
const LISTING_PAGE_SIZE = CATEGORY_LISTING_PAGE_SIZE;

function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[category page] Supabase env missing");
    return null;
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
  supabase: SupabaseClient | null,
  safeCategorySlug: string,
  requestedCountry: string | undefined,
): Promise<Array<{ label: string; slug: string }>> {
  if (!supabase) return [];
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
  supabase: SupabaseClient | null,
  safeCategorySlug: string,
  requestedCountry: string | undefined,
): Promise<{ businessCount: number; reviewCount: number }> {
  if (!supabase) return { businessCount: 0, reviewCount: 0 };
  try {
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

    const { count, error: countErr } = await countQuery;
    if (countErr) {
      console.warn("[category page] business count (metadata):", countErr.message);
    }
    const businessCount = count ?? 0;
    // Summing review_count row-by-row across thousands of businesses caused
    // statement timeouts and slow metadata. Title uses company count; true
    // review totals stay on business pages.
    return { businessCount, reviewCount: 0 };
  } catch (e) {
    console.error("[category page] loadCategoryCountsForMetadata:", e);
    return { businessCount: 0, reviewCount: 0 };
  }
}

/** When country-filtered listing is empty, load same category across all countries (no country filter). */
async function loadBusinessesWithoutCountryFilter(
  supabase: SupabaseClient,
  safeCategorySlug: string,
  pageIndex0: number,
): Promise<{ rows: CategoryBusinessRow[]; totalCount: number; hasNext: boolean }> {
  const offset = pageIndex0 * LISTING_PAGE_SIZE;
  const categories =
    safeCategorySlug === "banking"
      ? ["banking", "banking-and-money"]
      : [safeCategorySlug];
  try {
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id,name,slug,website,website_display,trust_score,review_count,category_slug,country_code,address,city,logo_url,status,tags,secondary_category_slugs",
      )
      .in("category_slug", categories)
      .eq("status", "active")
      .order("trust_score", { ascending: false })
      .order("review_count", { ascending: false })
      .order("name", { ascending: true })
      .range(offset, offset + LISTING_PAGE_SIZE);

    if (error || !Array.isArray(data)) {
      return { rows: [], totalCount: 0, hasNext: false };
    }

    const rows = data as CategoryBusinessRow[];
    for (const row of rows) {
      row.tags = mergeTagsForDisplay(
        row.tags,
        row.secondary_category_slugs,
        row.category_slug,
      );
    }
    const hasNext = rows.length > LISTING_PAGE_SIZE;
    const sliced = hasNext ? rows.slice(0, LISTING_PAGE_SIZE) : rows;

    const { count, error: countError } = await supabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .in("category_slug", categories)
      .eq("status", "active");

    if (countError) {
      return {
        rows: sliced,
        totalCount: offset + sliced.length + (hasNext ? 1 : 0),
        hasNext,
      };
    }

    return {
      rows: sliced,
      totalCount: count ?? sliced.length,
      hasNext,
    };
  } catch (e) {
    console.error("[category page] fallback listing (no country):", e);
    return { rows: [], totalCount: 0, hasNext: false };
  }
}

// ----------------------------
// METADATA (Next 16 compliant)
// ----------------------------
export async function generateMetadata(props: {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  let safeCategorySlug = "category";
  try {
    const { category_slug } = await props.params;
    safeCategorySlug = (category_slug ?? "category").trim().toLowerCase() || "category";
  } catch {
    safeCategorySlug = "category";
  }

  try {
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
    if (!supabase) {
      const fallbackTitle =
        safeCategorySlug
          .split("-")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ") || "Category";
      return {
        title: `Best ${fallbackTitle} Companies | Tellacity`,
        alternates: {
          canonical: `https://tellacity.com/categories/${safeCategorySlug}`,
        },
        robots: {
          index: true,
          follow: true,
        },
      };
    }

    let categoryName: string | null = null;

    if (safeCategorySlug) {
      try {
        const { data } = await supabase
          .from("categories")
          .select("name")
          .eq("slug", safeCategorySlug)
          .maybeSingle();

        categoryName = data?.name ?? null;
      } catch (e) {
        console.error("[category page] generateMetadata category lookup:", e);
      }
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
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    const fallbackTitle =
      safeCategorySlug
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") || "Category";
    return {
      title: `Best ${fallbackTitle} Companies | Tellacity`,
      alternates: {
        canonical: `https://tellacity.com/categories/${safeCategorySlug}`,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

// ----------------------------
// PAGE (Next 16 compliant)
// ----------------------------
export default async function Page(props: PageProps) {
  try {
    let safeCategorySlug = "category";
    try {
      const { category_slug } = await props.params;
      safeCategorySlug =
        (category_slug ?? "category").trim().toLowerCase() || "category";
    } catch (e) {
      console.error("[category page] params:", e);
    }

    let searchParams: { page?: string; country?: string } = {};
    try {
      searchParams = (await (props.searchParams ?? Promise.resolve({}))) as {
        page?: string;
        country?: string;
      };
    } catch (e) {
      console.error("[category page] searchParams:", e);
    }

    const pageNum = Math.max(
      1,
      parseInt(String(searchParams.page ?? "1"), 10) || 1,
    );

    const safeCountry =
      typeof searchParams?.country === "string"
        ? searchParams.country.toUpperCase()
        : null;
    const countryCode = normalizeCountryCode(safeCountry ?? undefined);
    const countryName = countryNameFromCode(countryCode);

    const supabase = getSupabase();

    let categoryRow: {
      slug: string;
      name: string | null;
      group_slug: string | null;
    } | null = null;

    if (supabase && safeCategorySlug) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("slug,name,group_slug")
          .eq("slug", safeCategorySlug)
          .maybeSingle();
        if (!error && data) {
          categoryRow = data as {
            slug: string;
            name: string | null;
            group_slug: string | null;
          };
        }
      } catch (e) {
        console.error("[category page] category fetch:", e);
      }
    }

    const categoryName =
      (categoryRow?.name ?? "").trim() ||
      safeCategorySlug
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    let categoryGroupName = "Business Services";
    if (supabase && categoryRow?.group_slug) {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from("category_groups")
          .select("name")
          .eq("slug", categoryRow.group_slug)
          .maybeSingle();
        if (!groupError) {
          const resolvedGroupName = String(groupData?.name ?? "").trim();
          if (resolvedGroupName) {
            categoryGroupName = resolvedGroupName;
          }
        }
      } catch (e) {
        console.error("[category page] category group fetch:", e);
      }
    }

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
      businesses = (pack.rows ?? []) as unknown[];
      companyCount = pack.totalCount;
      hasNextPage = pack.hasNext;
    } catch (e) {
      console.error("[category page] prefetch:", e);
      businesses = [];
      companyCount = 0;
      hasNextPage = false;
    }

    const hadExplicitCountryParam =
      typeof searchParams.country === "string" &&
      searchParams.country.trim() !== "";

    if (
      businesses.length === 0 &&
      hadExplicitCountryParam &&
      supabase
    ) {
      try {
        const fallback = await loadBusinessesWithoutCountryFilter(
          supabase,
          safeCategorySlug,
          pageNum - 1,
        );
        businesses = fallback.rows as unknown[];
        companyCount = fallback.totalCount;
        hasNextPage = fallback.hasNext;
      } catch (e) {
        console.error("[category page] fallback no-country:", e);
      }
    }

    let popularTags: Array<{ label: string; slug: string }> = [];
    try {
      popularTags = await loadPopularTagsForCategory(
        supabase,
        safeCategorySlug,
        searchParams?.country,
      );
    } catch (e) {
      console.error("[category page] popularTags:", e);
    }

    return (
      <>
        <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs text-[#1FAF9E]">
              Categories <span className="mx-1">›</span> {categoryGroupName}{" "}
              <span className="mx-1">›</span> {categoryName}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
              Best {categoryName} companies in {countryName}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Find the best {categoryName} companies in {countryName}. Compare
              ratings, read real customer reviews, and choose trusted providers
              based on real experiences.
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
  } catch (error) {
    console.error("[category page] render failed:", error);
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm text-gray-600">
          Category listings are temporarily unavailable. Please try again
          shortly.
        </p>
      </div>
    );
  }
}
