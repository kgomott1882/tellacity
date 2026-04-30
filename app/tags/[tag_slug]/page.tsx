import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import { getCachedTagListingPage } from "@/lib/cachedCategoryListing";
import CategoryClient from "../../categories/[category_slug]/CategoryClient";
import { normalizeCountryCode } from "@/lib/country";
import type { CategoryBusinessRow } from "@/lib/categoryListingQueries";
import { normalizeBusinessTags } from "@/lib/businessTags";

type PageProps = {
  params: Promise<{ tag_slug: string }>;
  searchParams?: Promise<{ country?: string }>;
};

const GLOBAL_TAG_FALLBACK_LIMIT = 1000;
const COUNTRY_NAME_BY_CODE: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  ZA: "South Africa",
  AU: "Australia",
  CA: "Canada",
  NZ: "New Zealand",
  IE: "Ireland",
};

function toReadableTag(tagSlug: string): string {
  return tagSlug.replace(/-/g, " ").trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function sanitizeTagSlug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function buildRelatedTags(
  rows: CategoryBusinessRow[],
  currentTagSlug: string,
): Array<{ slug: string; name: string }> {
  const counts = new Map<string, number>();
  const currentTag = sanitizeTagSlug(currentTagSlug);

  for (const row of rows) {
    const tags = normalizeBusinessTags((row as { tags?: unknown }).tags);
    for (const tag of tags) {
      const normalized = sanitizeTagSlug(tag);
      if (!normalized || normalized === currentTag) {
        continue;
      }
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  const toTags = (minCount: number) =>
    Array.from(counts.entries())
      .filter(([, count]) => count >= minCount)
      .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
      .slice(0, 15)
      .map(([slug]) => ({
        slug,
        name: toTitleCase(toReadableTag(slug)),
      }));

  const strict = toTags(3);
  if (strict.length > 0) return strict;
  const medium = toTags(2);
  if (medium.length > 0) return medium;
  return toTags(1);
}

async function fetchGlobalRelatedTagFallback(
  currentTagSlug: string,
): Promise<Array<{ slug: string; name: string }>> {
  try {
    const { data, error } = await supabaseServer
      .from("businesses")
      .select("tags")
      .eq("status", "active")
      .limit(GLOBAL_TAG_FALLBACK_LIMIT);
    if (error || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    const counts = new Map<string, number>();
    const currentTag = sanitizeTagSlug(currentTagSlug);
    for (const row of data as Array<{ tags: unknown }>) {
      const tags = normalizeBusinessTags(row.tags);
      for (const tag of tags) {
        const normalized = sanitizeTagSlug(tag);
        if (!normalized || normalized === currentTag) continue;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count >= 1)
      .sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])))
      .slice(0, 10)
      .map(([slug]) => ({
        slug,
        name: toTitleCase(toReadableTag(slug)),
      }));
  } catch {
    return [];
  }
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata> {
  const { tag_slug } = await props.params;
  const safeTagSlug = sanitizeTagSlug(tag_slug);
  const tag = toReadableTag(safeTagSlug);

  return {
    title: `${tag} Reviews & Companies | Tellacity`,
    description: `Explore ${tag} businesses. Read customer reviews, compare companies, and find trusted providers on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/tags/${safeTagSlug}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function TagBusinessesPage(props: PageProps) {
  const { tag_slug } = await props.params;
  const searchParams = (await (props.searchParams ?? Promise.resolve({}))) as {
    country?: string;
  };
  const safeTagSlug = sanitizeTagSlug(tag_slug);
  const tag = toTitleCase(toReadableTag(safeTagSlug));
  const normalizedCountryCode = searchParams.country
    ? normalizeCountryCode(searchParams.country)
    : null;
  const countryCodeForQuery = normalizedCountryCode ?? "US";
  const countryName = normalizedCountryCode
    ? (COUNTRY_NAME_BY_CODE[normalizedCountryCode] ?? normalizedCountryCode)
    : "";

  const listing = await getCachedTagListingPage(
    safeTagSlug,
    countryCodeForQuery,
    0,
    0,
  );

  const businesses = listing.rows ?? [];
  const hasNextPage = Boolean(listing.hasNext);
  const companyCount =
    typeof listing.totalCount === "number"
      ? listing.totalCount
      : businesses.length;

  const categorySlugForBestLink =
    businesses.length > 0
      ? String(businesses[0]?.category_slug ?? "")
          .trim()
          .toLowerCase()
      : "";

  let relatedTags = buildRelatedTags(businesses, safeTagSlug);
  if (relatedTags.length === 0) {
    relatedTags = await fetchGlobalRelatedTagFallback(safeTagSlug);
  }

  const countryQuery =
    normalizedCountryCode != null
      ? `?country=${encodeURIComponent(normalizedCountryCode)}`
      : "";

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
            Best {tag} companies{" "}
            {normalizedCountryCode ? `in ${countryName}` : ""}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Discover the best {tag} companies on Tellacity. Compare trusted
            businesses, read real customer reviews, and find top-rated providers
            based on authentic feedback.
          </p>
          {normalizedCountryCode &&
            businesses.length > 0 &&
            categorySlugForBestLink && (
            <div style={{ marginTop: "10px" }}>
              <a
                href={`/best/${normalizedCountryCode.toLowerCase()}/${categorySlugForBestLink}`}
                style={{
                  fontSize: "13px",
                  color: "#1FAF9E",
                  textDecoration: "none",
                }}
              >
                View top {tag} companies in {countryName} →
              </a>
            </div>
          )}
          {businesses.length === 0 && (
            <p className="mt-3 text-sm text-gray-500">
              No businesses with this tag yet.
            </p>
          )}
        </div>
      </section>
      <CategoryClient
        key={`${safeTagSlug}-${countryCodeForQuery}`}
        listingKind="tag"
        categorySlug={safeTagSlug}
        initialCountryCode={countryCodeForQuery}
        businesses={businesses}
        companyCount={companyCount}
        hasNextPage={hasNextPage}
      />
      {relatedTags.length > 0 && (
        <div
          style={{ marginTop: "40px" }}
          className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"
        >
          <h2>Related searches</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {relatedTags.map((tagItem) => (
              <a
                key={tagItem.slug}
                href={`/tags/${tagItem.slug}${countryQuery}`}
                style={{
                  padding: "6px 10px",
                  border: "1px solid #ddd",
                  borderRadius: "20px",
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                {tagItem.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
