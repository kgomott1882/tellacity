import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import CategoryClient from "../../categories/[category_slug]/CategoryClient";
import { normalizeCountryCode } from "@/lib/country";
import type { CategoryBusinessRow } from "@/lib/categoryListingQueries";
import { normalizeBusinessTags } from "@/lib/businessTags";

type PageProps = {
  params: Promise<{ tag_slug: string }>;
  searchParams?: Promise<{ country?: string }>;
};

const PAGE_SIZE = 10;
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

async function fetchBusinessesByTag(
  tagSlug: string,
  countryCode: string | null,
): Promise<CategoryBusinessRow[]> {
  const normalizedSlug = sanitizeTagSlug(tagSlug);
  const readableTag = toReadableTag(normalizedSlug);
  const countryAliases = countryCode
    ? countryCode === "GB"
      ? ["GB", "UK", "GBR"]
      : [countryCode]
    : null;

  const tagNeedles = new Set<string>([
    normalizedSlug,
    readableTag.trim().toLowerCase(),
    readableTag.trim().toLowerCase().replace(/\s+/g, "-"),
  ]);

  try {
    let query = supabaseServer
      .from("businesses")
      .select(
        "id,name,slug,website,trust_score,review_count,category_slug,country_code,address,city,display_location,logo_url,resolved_logo_url,tags",
      )
      .eq("status", "active")
      .not("slug", "is", null)
      .order("trust_score", { ascending: false })
      .order("review_count", { ascending: false })
      .order("name", { ascending: true })
      .limit(5000);

    if (countryAliases && countryAliases.length > 0) {
      query = query.in("country_code", countryAliases);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const rows = (data ?? []) as CategoryBusinessRow[];
    const matchedRows = rows.filter((row) => {
      const normalizedTags = normalizeBusinessTags((row as { tags?: unknown }).tags);
      return normalizedTags.some((tag) => {
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) {
          return false;
        }
        return (
          tagNeedles.has(normalizedTag) ||
          tagNeedles.has(normalizedTag.replace(/\s+/g, "-"))
        );
      });
    });

    return matchedRows.slice(0, PAGE_SIZE + 1);
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
  const countryName = normalizedCountryCode
    ? (COUNTRY_NAME_BY_CODE[normalizedCountryCode] ?? normalizedCountryCode)
    : "";
  const fetchedRows = await fetchBusinessesByTag(
    safeTagSlug,
    normalizedCountryCode,
  );
  const hasNextPage = fetchedRows.length > PAGE_SIZE;
  const businesses = hasNextPage ? fetchedRows.slice(0, PAGE_SIZE) : fetchedRows;
  const categorySlug =
    businesses
      .map((row) => String(row.category_slug ?? "").trim().toLowerCase())
      .find(Boolean) ?? safeTagSlug;
  let relatedTags = buildRelatedTags(businesses, safeTagSlug);
  if (relatedTags.length === 0) {
    relatedTags = await fetchGlobalRelatedTagFallback(safeTagSlug);
  }

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
          {normalizedCountryCode && categorySlug && (
            <div style={{ marginTop: "10px" }}>
              <a
                href={`/best/${normalizedCountryCode.toLowerCase()}/${categorySlug}`}
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
              No businesses found under this category yet.
            </p>
          )}
        </div>
      </section>
      <CategoryClient
        categorySlug={safeTagSlug}
        initialCountryCode={normalizedCountryCode ?? "US"}
        businesses={businesses}
        companyCount={businesses.length}
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
                href={`/tags/${tagItem.slug}`}
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
