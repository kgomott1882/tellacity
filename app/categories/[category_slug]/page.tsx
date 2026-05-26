export const dynamic = "force-dynamic";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import CategoryClient from "./CategoryClient";
import { normalizeCountryCode } from "@/lib/country";
import { buildCategoryPageJsonLdScripts } from "@/lib/categoryPageJsonLd";
import { normalizeBusinessTags } from "@/lib/businessTags";
import { getCachedCategoryListingPage } from "@/lib/cachedCategoryListing";

type PageProps = {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string; country?: string }>;
};
/** Cap tag scan per request. Avoids heavy reads on huge categories. */
const TAG_FETCH_LIMIT = 500;
const GLOBAL_TAG_FALLBACK_LIMIT = 400;
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

// ----------------------------
// METADATA (Next 16 compliant)
// ----------------------------
export async function generateMetadata(props: {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string; country?: string }>;
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
    const canonicalUrl = `https://tellacity.com/categories/${safeCategorySlug}?country=${countryCode}`;
    const supabase = getSupabase();

    let categoryName: string | null = null;

    if (supabase && safeCategorySlug) {
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
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    const categoryNameFinal = categoryName ?? fallbackTitle;
    const baseTitle = `Best ${categoryNameFinal} in ${countryName} | Tellacity`;
    const metaTitle = pageNum > 1 ? `${baseTitle} – Page ${pageNum}` : baseTitle;
    const description = `Browse the best ${categoryNameFinal} providers in ${countryName}. Compare TrustScores, read real customer reviews, and choose trusted companies based on verified feedback on Tellacity.`;

    if (!supabase) {
      return {
        title: metaTitle,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
          title: metaTitle,
          description,
          url: canonicalUrl,
          siteName: "Tellacity",
          type: "website",
        },
        twitter: {
          card: "summary_large_image",
          title: metaTitle,
          description,
        },
        robots: { index: true, follow: true },
      };
    }

    return {
      title: metaTitle,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: metaTitle,
        description,
        url: canonicalUrl,
        siteName: "Tellacity",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: metaTitle,
        description,
      },
      robots: { index: true, follow: true },
    };
  } catch {
    const fallbackTitle =
      safeCategorySlug
        .split("-")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") || "Category";
    return {
      title: `Best ${fallbackTitle} | Tellacity`,
      alternates: {
        canonical: `https://tellacity.com/categories/${safeCategorySlug}`,
      },
      robots: { index: true, follow: true },
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
    let categoryGroupSlug = "";
    let categoryGroupName = "Business Services";
    if (supabase && categoryRow?.group_slug) {
      categoryGroupSlug = String(categoryRow.group_slug).trim();
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
      companyCount = pack.totalCount ?? 0;
      hasNextPage = pack.hasNext;
    } catch (e) {
      console.error("[category page] prefetch:", e);
      businesses = [];
      companyCount = 0;
      hasNextPage = false;
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

    const jsonLdScripts = buildCategoryPageJsonLdScripts({
      categoryName,
      categorySlug: safeCategorySlug,
      categoryGroupName,
      categoryGroupSlug,
      countryCode,
      countryName,
      businesses: (businesses as Array<{ name?: string | null; slug?: string | null }>)
        .map((row) => ({
          name: String(row.name ?? "").trim(),
          slug: String(row.slug ?? "").trim().toLowerCase(),
        }))
        .filter((row) => row.name && row.slug),
      totalCount: companyCount,
    });

    return (
      <>
        {jsonLdScripts.map((script, index) => (
          <script
            key={`category-jsonld-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(script) }}
          />
        ))}
        <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="text-xs text-[#1FAF9E]" aria-label="Breadcrumb">
              <Link href="/categories" className="hover:underline">
                Categories
              </Link>
              <span className="mx-1">›</span>
              {categoryGroupSlug ? (
                <>
                  <Link
                    href={`/categories/${categoryGroupSlug}?country=${countryCode}`}
                    className="hover:underline"
                  >
                    {categoryGroupName}
                  </Link>
                  <span className="mx-1">›</span>
                </>
              ) : null}
              <span className="text-gray-700">{categoryName}</span>
            </nav>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0E0E0E]">
              Best {categoryName} in {countryName}
            </h1>
            <h2 className="mt-4 text-lg font-semibold text-[#0E0E0E]">
              Find the best {categoryName} providers in {countryName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Compare ratings, read real customer reviews, and choose trusted
              providers based on verified experiences on Tellacity.
            </p>
            <h2 className="mt-6 text-base font-semibold text-[#0E0E0E]">
              Top {categoryName} companies in {countryName}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              This leaderboard shows the highest-rated {categoryName} providers in{" "}
              {countryName}, ranked by TrustScore, review volume, and recent feedback.
              You can click through to any business to read reviews, see photos, and
              compare services.
            </p>
            <div className="mt-3">
              <Link
                href={`/best/${countryCode.toLowerCase()}/${safeCategorySlug}`}
                className="text-sm font-medium text-[#1FAF9E] hover:underline"
              >
                View best {categoryName} companies in {countryName} →
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
              <span>• Ranked by TrustScore</span>
              <span>• Filter by rating &amp; country</span>
              <span>• Read &amp; share experiences</span>
            </div>
          </div>
        </section>

        <CategoryClient
          key={`${safeCategorySlug}-${countryCode}`}
          categorySlug={safeCategorySlug}
          initialCountryCode={countryCode}
          initialCategoryName={categoryName}
          initialCategoryGroupName={categoryGroupName}
          initialCategoryGroupSlug={categoryGroupSlug}
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
