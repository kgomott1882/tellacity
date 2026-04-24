"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CategoryBusinessRow } from "@/lib/categoryListingQueries";
import { comparisonLinks } from "@/lib/comparisonLinks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { similarBusinessLogoUrl } from "@/lib/logo";
import { formatBusinessAddress } from "@/lib/address";
import {
  businessCategoryPillClassName,
  businessTagPillClassName,
  formatBusinessTagLabel,
  mergeTagsForDisplay,
} from "@/lib/businessTags";
import { getStoredCountry, normalizeCountryCode, setStoredCountry } from "@/lib/country";
import { sanitizeText } from "@/lib/sanitizeText";
import { RefreshCw } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import CategoryInfoTooltip from "@/components/categories/CategoryInfoTooltip";

type BusinessRow = CategoryBusinessRow;

/** Match business profile / search: use stored logo + website → logo.dev fallback. */
function categoryListLogoUrl(
  row: Pick<BusinessRow, "website"> & {
    logo_url?: string | null;
    resolved_logo_url?: string | null;
  }
): string | null {
  return similarBusinessLogoUrl({
    resolved_logo_url: row.resolved_logo_url ?? null,
    logo_url: row.logo_url ?? null,
    website: row.website,
  });
}

type CountryOption = {
  code: string;
  name: string;
  flagUrl: string;
};

const PAGE_SIZE = 10;

/** URL uses 1-based `?page=` (omit or 1 = first page). Returns 0-based index for the listing API. */
function listingPageIndexFromSearch(params: URLSearchParams): number {
  const raw = params.get("page");
  const pageNum = Math.max(1, parseInt(String(raw ?? "1"), 10) || 1);
  return pageNum - 1;
}

/** How many candidates to pull for “Top rated” before live review aggregation + top 8. */
const TOP_RATED_CANDIDATE_LIMIT = 40;
const TOP_RATED_DISPLAY_COUNT = 8;

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

function snapshotRpcRating(row: BusinessRow): { trust: number; count: number } {
  const trust =
    (Number(row.trust_score ?? 0) || 0) ||
    (Number(row.average_rating ?? 0) || 0) ||
    (Number(row.avg_rating ?? 0) || 0);
  return { trust, count: Number(row.review_count ?? 0) || 0 };
}

type TopRatedDisplayItem = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  trustScore: number;
  reviewCount: number;
  /** Primary category slug for first pill (may differ from page filter). */
  categorySlug: string | null;
  tags: string[];
};

function mapRowToTopRatedItem(
  business: BusinessRow,
  index: number
): TopRatedDisplayItem | null {
  const safeSlug = (business.slug ?? "").trim().toLowerCase();
  if (!isValidSlug(safeSlug)) return null;
  const logoUrl = categoryListLogoUrl(business);
  const trustScore =
    typeof business.trust_score === "number" ? business.trust_score : 0;
  const reviewCount =
    typeof business.review_count === "number" ? business.review_count : 0;
  const catSlug = (business.category_slug ?? "").trim().toLowerCase() || null;
  return {
    id: business.id ?? `top-${index}-${safeSlug}`,
    slug: safeSlug,
    name: (business.name ?? "").trim() || "Business",
    logoUrl,
    trustScore,
    reviewCount,
    categorySlug: catSlug,
    tags: mergeTagsForDisplay(
      business.tags,
      business.secondary_category_slugs,
      business.category_slug,
    ),
  };
}

const COUNTRIES: CountryOption[] = [
  {
    code: "US",
    name: "United States",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg",
  },
  {
    code: "GB",
    name: "United Kingdom",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg",
  },
  {
    code: "ZA",
    name: "South Africa",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/ZA.svg",
  },
  {
    code: "AU",
    name: "Australia",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/AU.svg",
  },
  {
    code: "CA",
    name: "Canada",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/CA.svg",
  },
  {
    code: "NZ",
    name: "New Zealand",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/NZ.svg",
  },
  {
    code: "IE",
    name: "Ireland",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/IE.svg",
  },
];

export type CategoryClientProps = {
  categorySlug: string;
  businesses: any[];
  companyCount: number;
  hasNextPage: boolean;
  initialCountryCode: string;
};

export default function CategoryClient({
  categorySlug,
  businesses = [],
  companyCount = 0,
  hasNextPage = false,
  initialCountryCode,
}: CategoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---------- LIVE DATA STATE (this was missing) ----------
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rows, setRows] = useState<BusinessRow[]>((businesses ?? []) as BusinessRow[]);
  const [computedCount, setComputedCount] = useState<number>(companyCount ?? 0);
  const [computedHasNext, setComputedHasNext] = useState<boolean>(hasNextPage ?? false);

  /** Listing page from `?page=` so browser back/forward and shared links preserve pagination. */
  const listingPageIndex = useMemo(
    () => listingPageIndexFromSearch(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const pushSearchParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const s = params.toString();
      router.push(s ? `?${s}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  const goToListingPage = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, nextIndex);
      pushSearchParams((p) => {
        if (clamped <= 0) p.delete("page");
        else p.set("page", String(clamped + 1));
      });
    },
    [pushSearchParams],
  );

  const stripListingPageFromUrl = useCallback(() => {
    pushSearchParams((p) => {
      p.delete("page");
    });
  }, [pushSearchParams]);

  const [categoryName, setCategoryName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const sortParam = searchParams.get("sort");
  const currentSort: "rating" | "reviews" | "recent" =
    sortParam === "reviews" ? "reviews" : sortParam === "recent" ? "recent" : "rating";
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  const queryCountry = searchParams.get("country");
  // URL + server-provided country only during render to avoid hydration mismatch.
  const derivedCountry = normalizeCountryCode(
    queryCountry ?? initialCountryCode ?? undefined
  );

  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    derivedCountry
  );
  const [countryOpen, setCountryOpen] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const RECENT_PAGE_SIZE = 3;

  const businessesList = rows ?? [];

  const sortedBusinessesList = useMemo(() => {
    const list = [...businessesList];
    if (currentSort === "reviews") {
      list.sort((a, b) => {
        const ac = Number(a.review_count ?? 0) || 0;
        const bc = Number(b.review_count ?? 0) || 0;
        if (bc !== ac) return bc - ac;
        const ar = Number(a.trust_score ?? 0) || 0;
        const br = Number(b.trust_score ?? 0) || 0;
        if (br !== ar) return br - ar;
        return (a.name || "").localeCompare(b.name || "");
      });
    } else if (currentSort === "recent") {
      list.sort((a, b) => {
        const ac = Number(a.review_count ?? 0) || 0;
        const bc = Number(b.review_count ?? 0) || 0;
        if (bc !== ac) return bc - ac;
        return (a.name || "").localeCompare(b.name || "");
      });
    } else {
      list.sort((a, b) => {
        const ar = Number(a.trust_score ?? 0) || 0;
        const br = Number(b.trust_score ?? 0) || 0;
        if (br !== ar) return br - ar;
        const ac = Number(a.review_count ?? 0) || 0;
        const bc = Number(b.review_count ?? 0) || 0;
        if (bc !== ac) return bc - ac;
        return (a.name || "").localeCompare(b.name || "");
      });
    }
    return list;
  }, [businessesList, currentSort]);

  const [topRatedItems, setTopRatedItems] = useState<TopRatedDisplayItem[]>([]);
  const [topRatedLoading, setTopRatedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadTopRated = async () => {
      if (!categorySlug) {
        setTopRatedItems([]);
        setTopRatedLoading(false);
        return;
      }

      setTopRatedLoading(true);
      const countryCode = derivedCountry ?? "US";
      const min = typeof minRating === "number" ? minRating : 0;

      const q = new URLSearchParams();
      q.set("slug", categorySlug);
      q.set("country", countryCode);
      q.set("minRating", String(min));
      q.set("mode", "top");
      q.set("candidateLimit", String(TOP_RATED_CANDIDATE_LIMIT));
      const res = await fetch(`/api/category-listings?${q.toString()}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(28_000),
      });
      const data = (await res.json()) as {
        rows?: BusinessRow[];
        error?: string | null;
      };

      if (cancelled) return;

      const topRows = Array.isArray(data.rows) ? data.rows : [];
      if (!res.ok && topRows.length === 0) {
        setTopRatedItems([]);
        setTopRatedLoading(false);
        return;
      }

      if (data.error && topRows.length === 0) {
        setTopRatedItems([]);
        setTopRatedLoading(false);
        return;
      }

      const list = topRows.map((r) => ({ ...r }));

      list.sort((a, b) => {
        const ar = Number(a.trust_score ?? 0);
        const br = Number(b.trust_score ?? 0);
        const ac = Number(a.review_count ?? 0);
        const bc = Number(b.review_count ?? 0);
        if (br !== ar) return br - ar;
        if (bc !== ac) return bc - ac;
        return (a.name || "").localeCompare(b.name || "");
      });

      const items = list
        .filter((r) => (Number(r.review_count ?? 0) || 0) > 0)
        .slice(0, TOP_RATED_DISPLAY_COUNT)
        .map((r, i) => mapRowToTopRatedItem(r, i))
        .filter((x): x is TopRatedDisplayItem => Boolean(x));

      setTopRatedItems(items);
      setTopRatedLoading(false);
    };

    void loadTopRated();

    return () => {
      cancelled = true;
    };
  }, [categorySlug, derivedCountry, minRating]);

  // Keep selectedCountry in sync with URL and global country
  useEffect(() => {
    setSelectedCountry(derivedCountry);
  }, [derivedCountry, categorySlug]);

  // URL is source of truth; storage only fills missing URL country.
  useEffect(() => {
    if (!queryCountry && typeof window !== "undefined") {
      const stored = getStoredCountry();
      if (stored) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("country", stored);
        params.delete("page");
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [queryCountry, searchParams, router]);

  const popularSearches = useMemo(() => {
    if (subcategories.length > 0) return subcategories.slice(0, 8);
    return [];
  }, [subcategories]);

  const [recentPage, setRecentPage] = useState(0);
  const recentCompanies = useMemo(() => {
    const start = recentPage * RECENT_PAGE_SIZE;
    return sortedBusinessesList.slice(start, start + RECENT_PAGE_SIZE);
  }, [sortedBusinessesList, recentPage]);

  const recentHasPrev = recentPage > 0;
  const recentHasNext =
    (recentPage + 1) * RECENT_PAGE_SIZE < sortedBusinessesList.length;

  const title = useMemo(() => {
    if (categoryName) return categoryName;
    if (!categorySlug) return "Category";
    return categorySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [categorySlug, categoryName]);
  const countryName =
    COUNTRIES.find((country) => country.code === (derivedCountry ?? ""))?.name ??
    derivedCountry ??
    "United States";
  const countryCode = derivedCountry ?? "US";

  // ---------- FIXED CATEGORY INFO (uses group_slug) ----------
  useEffect(() => {
    let isMounted = true;

    const fetchCategoryInfo = async () => {
      if (!categorySlug) {
        if (isMounted) {
          setCategoryName("");
          setGroupName("");
          setSubcategories([]);
        }
        return;
      }

      const supabase = supabaseBrowser();
      // categories: slug, name, group_slug
      const { data: categoryData } = await supabase
        .from("categories")
        .select("name, group_slug")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (!isMounted) return;

      // If this slug is actually a group page
      if (!categoryData) {
        const { data: groupData } = await supabase
          .from("category_groups")
          .select("name")
          .eq("slug", categorySlug)
          .maybeSingle();

        if (isMounted) {
          setCategoryName(groupData?.name ?? "");
          setGroupName("");
        }

        const { data: related } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("group_slug", categorySlug)
          .order("name", { ascending: true });

        if (isMounted) setSubcategories(related ?? []);
        return;
      }

      setCategoryName(categoryData.name ?? "");

      if (categoryData.group_slug) {
        const { data: groupData } = await supabase
          .from("category_groups")
          .select("name")
          .eq("slug", categoryData.group_slug)
          .maybeSingle();

        if (isMounted) setGroupName(groupData?.name ?? "");

        const { data: related } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("group_slug", categoryData.group_slug)
          .order("name", { ascending: true });

        if (isMounted) {
          setSubcategories((related ?? []).filter((item) => item.slug !== categorySlug));
        }
      } else {
        setGroupName("");
        setSubcategories([]);
      }
    };

    fetchCategoryInfo();

    return () => {
      isMounted = false;
    };
  }, [categorySlug]);

  // ---------- THE REAL FIX: FETCH BUSINESSES ----------
  useEffect(() => {
    let isMounted = true;

    const fetchBusinesses = async () => {
      if (!categorySlug) return;

      setLoading(true);
      setFetchError(null);

      const offset = listingPageIndex * PAGE_SIZE;
      const countryCode = derivedCountry ?? "US";
      const min = typeof minRating === "number" ? minRating : 0;

      const q = new URLSearchParams();
      q.set("slug", categorySlug);
      q.set("country", countryCode);
      q.set("page", String(listingPageIndex));
      q.set("minRating", String(min));
      q.set("mode", "page");
      const res = await fetch(`/api/category-listings?${q.toString()}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(28_000),
      });
      const data = (await res.json()) as {
        rows?: BusinessRow[];
        totalCount?: number;
        hasNext?: boolean;
        error?: string | null;
      };

      if (!isMounted) return;

      const list = Array.isArray(data.rows) ? data.rows : [];
      if (!res.ok && list.length === 0) {
        setRows([]);
        setComputedCount(offset);
        setComputedHasNext(false);
        setFetchError("Failed to load businesses.");
        setLoading(false);
        return;
      }

      if (data.error && list.length === 0) {
        setRows([]);
        setComputedCount(offset);
        setComputedHasNext(false);
        setFetchError(data.error ?? "Failed to load businesses.");
        setLoading(false);
        return;
      }

      const hasNext = Boolean(data.hasNext);
      const sliced = list;

      setRows(sliced);
      setComputedCount(
        typeof data.totalCount === "number"
          ? data.totalCount
          : offset + sliced.length + (hasNext ? 1 : 0)
      );
      setComputedHasNext(hasNext);
      setFetchError(data.error ?? null);
      setLoading(false);
    };

    fetchBusinesses();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, listingPageIndex, minRating, derivedCountry]);

  // Page title/meta
  useEffect(() => {
    const pageTitle = `${title} Businesses | Tellacity`;
    const description = `Explore top rated businesses in ${title}. Read verified customer feedback on Tellacity.`;

    if (typeof document !== "undefined") {
      document.title = pageTitle;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [siteUrl, title]);

  useEffect(() => {
    setRecentPage(0);
  }, [categorySlug]);

  const updateCountry = (code: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (code) {
      setStoredCountry(code);
      params.set("country", code);
    } else {
      params.delete("country");
    }
    const s = params.toString();
    router.push(s ? `?${s}` : "?", { scroll: false });
  };

  const resetFilters = () => {
    setMinRating(null);
    updateCountry(null);
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${title} Reviews & Ratings`,
    ...(siteUrl && categorySlug ? { url: `${siteUrl}/categories/${categorySlug}` } : {}),
    ...(sortedBusinessesList.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: sortedBusinessesList.slice(0, 10).map((business, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: business.name,
              url: siteUrl ? `${siteUrl}/b/${business.slug}` : `/b/${business.slug}`,
            })),
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          {(topRatedLoading || topRatedItems.length > 0) && (
            <section className="rounded-2xl border-2 border-[#1FAF9E]/45 bg-white p-5 shadow-[0_12px_36px_-14px_rgba(31,175,158,0.7)]">
              <h2 className="text-xl font-semibold text-[#0E0E0E]">Top rated businesses in {title}</h2>
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                Discover trusted {categoryName || title} companies in {countryName}. Read real customer reviews, compare ratings, and find the best businesses based on real experiences from people like you.
              </p>
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                Top-rated {categoryName} companies in {countryName} based on real customer reviews, trust scores, and verified feedback from customers.
              </p>
              {topRatedLoading ? (
                <p className="mt-4 text-sm text-gray-500">Loading ratings…</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {topRatedItems.map((business) => (
                    <Link
                      key={business.id}
                      href={`/b/${business.slug}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0E0E0E] transition-colors hover:border-[#1FAF9E] hover:bg-[#F8FFFE]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#EDEDED] bg-[#FCF7F6]">
                        {business.logoUrl ? (
                          <img
                            src={business.logoUrl}
                            alt={`${sanitizeText(business.name)} logo`}
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate">{sanitizeText(business.name)}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <RatingStars
                            rating={business.trustScore}
                            reviewCount={business.reviewCount}
                            size={11}
                          />
                          <span className="font-medium text-[#0E0E0E]">
                            {business.trustScore.toFixed(1)}
                          </span>
                          <span>
                            • {business.reviewCount.toLocaleString("en-US")} reviews
                          </span>
                        </div>
                        {(business.categorySlug || business.tags.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {business.categorySlug && (
                              <span className={businessCategoryPillClassName()}>
                                {formatBusinessTagLabel(business.categorySlug)}
                              </span>
                            )}
                            {business.tags.map((tag, idx) => (
                              <span
                                key={`${business.id}-${tag}`}
                                className={businessTagPillClassName(
                                  idx + (business.categorySlug ? 1 : 0),
                                )}
                              >
                                {formatBusinessTagLabel(tag)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* How this page works (desktop / tablet only) */}
          <section className="mt-8 hidden gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 sm:grid sm:grid-cols-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Ranked by trust
              </h2>
              <p>
                Listings are ordered using a combination of TrustScore, review volume, and recent activity in this
                category.
              </p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Filter by rating & location
              </h2>
              <p>
                Use rating and country filters to focus on the businesses most relevant to your needs and region.
              </p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Read & share experiences
              </h2>
              <p>
                Click into a business to read detailed reviews or share your own experience to help others decide.
              </p>
            </div>
          </section>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
              onClick={() => setFiltersOpen(true)}
              type="button"
            >
              All filters
            </button>

            <button
              className="relative inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700"
              onClick={() => setRatingOpen((prev) => !prev)}
              type="button"
            >
              Rating
            </button>

            {ratingOpen && (
              <div className="relative">
                <div className="absolute left-0 top-2 z-10 w-72 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-600">Rating</div>
                    <button
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-600"
                      onClick={() => setRatingOpen(false)}
                      type="button"
                      aria-label="Close rating"
                    >
                      ×
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { label: "All", value: null },
                      { label: "3+", value: 3 },
                      { label: "4+", value: 4 },
                      { label: "4.5+", value: 4.5 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                          minRating === option.value
                            ? "border-[#1FAF9E] bg-[#E8F7F5] text-[#0E0E0E]"
                            : "border-gray-300 text-gray-700"
                        }`}
                        onClick={() => {
                          setMinRating(option.value);
                          setRatingOpen(false);
                          stripListingPageFromUrl();
                        }}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <span>
              Companies ({computedCount > 0 ? computedCount.toLocaleString("en-US") : sortedBusinessesList.length.toLocaleString("en-US")})
            </span>

            <div className="relative">
              <button
                className="inline-flex items-center gap-2 text-gray-600"
                onClick={() => setSortOpen((prev) => !prev)}
                type="button"
                aria-expanded={sortOpen}
                aria-haspopup="true"
              >
                Sort by:{" "}
                <span className="font-medium text-gray-800">
                  {currentSort === "rating"
                    ? "Leaderboard (highest rated)"
                    : currentSort === "reviews"
                    ? "Highest number of reviews"
                    : "Most reviews (activity)"}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {sortOpen && (
                <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-lg">
                  <button
                    className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("sort");
                      params.delete("page");
                      router.push(`?${params.toString()}`, { scroll: false });
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border ${
                        currentSort === "rating" ? "border-[#1FAF9E] bg-[#1FAF9E]" : "border-gray-300 bg-white"
                      }`}
                    />
                    <span>
                      <span className="block font-medium text-gray-900">Leaderboard (highest rated)</span>
                      <span className="block text-xs text-gray-500">
                        Star average first, then review count — same ordering as the category directory in Supabase.
                      </span>
                    </span>
                  </button>

                  <button
                    className="mt-2 flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("sort", "reviews");
                      params.delete("page");
                      router.push(`?${params.toString()}`, { scroll: false });
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border ${
                        currentSort === "reviews" ? "border-[#1FAF9E] bg-[#1FAF9E]" : "border-gray-300 bg-white"
                      }`}
                    />
                    <span className="font-medium text-gray-900">Highest number of reviews</span>
                  </button>

                  <button
                    className="mt-2 flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("sort", "recent");
                      params.delete("page");
                      router.push(`?${params.toString()}`, { scroll: false });
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border ${
                        currentSort === "recent" ? "border-[#1FAF9E] bg-[#1FAF9E]" : "border-gray-300 bg-white"
                      }`}
                    />
                    <span className="font-medium text-gray-900">Most reviews (activity)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading / error (minimal) */}
          {loading && <p className="mt-6 text-sm text-gray-500">Loading businesses...</p>}
          {fetchError && (
            <div className="mt-2 flex flex-col items-center gap-3 text-sm text-red-600">
              <p className="max-w-2xl text-center leading-snug">{fetchError}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-md border border-red-200 bg-white p-2 text-red-700 shadow-sm hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                aria-label="Reload page and try again"
                title="Reload page"
              >
                <RefreshCw className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}

          <h2 className="text-lg font-semibold mt-6 mb-3">
            Best {categoryName} companies in {countryName}
          </h2>
          <div className="mb-4">
            <CategoryInfoTooltip categorySlug={categorySlug} />
          </div>
          <div className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200">
            {sortedBusinessesList.length === 0 && !loading && (
              <div className="px-4 py-6 text-sm text-gray-500">
                <p>No businesses listed in this category yet.</p>
                <Link
                  href="/categories"
                  className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                >
                  Browse all categories
                </Link>
              </div>
            )}

            {sortedBusinessesList.length > 0 &&
              sortedBusinessesList.map((business) => {
                const safeSlug = (business.slug ?? "").trim().toLowerCase();
                if (!isValidSlug(safeSlug)) return null;
                const reviewCount = (Number(business.review_count ?? 0)) || 0;
                const ratingValue = snapshotRpcRating(business).trust;
                const locationText =
                  formatBusinessAddress(business.address, business.city, business.country_code) ||
                  business.display_location;
                const businessTags = mergeTagsForDisplay(
                  business.tags,
                  business.secondary_category_slugs,
                  business.category_slug,
                );

                const logoUrl = categoryListLogoUrl(business);

                return (
                  <Link key={business.id} href={`/b/${safeSlug}`} className="block w-full">
                      <div className="flex flex-col gap-3 px-4 py-5 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${sanitizeText(business.name)} logo`}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#0E0E0E]">
                              {(sanitizeText(business.name)?.trim()?.charAt(0) || "B").toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-base font-semibold text-[#0E0E0E] truncate">{sanitizeText(business.name)}</div>
                            {reviewCount > 0 && (
                              <img
                                src="/brand/Tellacity%20Vefication%20Batch.png"
                                alt="Tellacity verified reviews"
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                          </div>
                          {business.website && <div className="text-sm text-gray-500 truncate">{sanitizeText(business.website)}</div>}
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                            <RatingStars
                              rating={ratingValue}
                              reviewCount={reviewCount}
                              size={12}
                            />
                            <span className="font-medium text-[#0E0E0E]">
                              {ratingValue.toFixed(1)}
                            </span>
                            <span className="text-gray-500">
                              • {reviewCount.toLocaleString("en-US")} reviews
                            </span>
                          </div>
                          {(business.category_slug || businessTags.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {business.category_slug && (
                                <span className={businessCategoryPillClassName()}>
                                  {formatBusinessTagLabel(business.category_slug)}
                                </span>
                              )}
                              {businessTags.map((tag, idx) => (
                                <span
                                  key={`${business.id}-${tag}`}
                                  className={businessTagPillClassName(
                                    idx + (business.category_slug ? 1 : 0),
                                  )}
                                >
                                  {formatBusinessTagLabel(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                          {locationText && (
                            <div className="mt-1 text-xs text-gray-500 sm:hidden">
                              {sanitizeText(locationText)}
                            </div>
                          )}
                        </div>
                      </div>

                      {locationText && (
                        <div className="hidden text-sm text-gray-500 sm:block sm:text-right sm:min-w-[180px]">
                          {sanitizeText(locationText)}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>

          {sortedBusinessesList.length > 0 && (
            <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
              <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
                  <button
                    className="px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                  onClick={() => goToListingPage(listingPageIndex - 1)}
                  disabled={listingPageIndex === 0}
                >
                  Previous
                </button>
                <span className="border-l border-gray-300 px-4 py-2 font-semibold text-gray-800">
                  Page {listingPageIndex + 1}
                </span>
                <button
                  className="border-l border-gray-300 px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                  onClick={() => goToListingPage(listingPageIndex + 1)}
                  disabled={!computedHasNext}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {popularSearches.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold text-[#0E0E0E]">Explore related categories</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {popularSearches.map((item) => {
                  const safeSlug = (item.slug ?? "").trim().toLowerCase();
                  if (!isValidSlug(safeSlug)) return null;
                  return (
                    <Link
                      key={item.id}
                      href={`/categories/${safeSlug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-[#1FAF9E]"
                    >
                      <span className="text-gray-500">🔍</span>
                      {sanitizeText(item.name)}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {recentCompanies.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#0E0E0E]">Recently reviewed companies</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() => setRecentPage((prev) => Math.max(0, prev - 1))}
                    disabled={!recentHasPrev}
                    aria-label="Previous companies"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#1FAF9E] text-[#1FAF9E] disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-300"
                    onClick={() => setRecentPage((prev) => prev + 1)}
                    disabled={!recentHasNext}
                    aria-label="Next companies"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentCompanies.map((company) => {
                  const safeSlug = (company.slug ?? "").trim().toLowerCase();
                  if (!isValidSlug(safeSlug)) return null;
                  const reviewCount = (Number(company.review_count ?? 0)) || 0;
                  const ratingValue = snapshotRpcRating(company).trust;
                  const logoUrl = categoryListLogoUrl(company);
                  const companyTags = mergeTagsForDisplay(
                    company.tags,
                    company.secondary_category_slugs,
                    company.category_slug,
                  );

                  return (
                    <Link
                      key={company.id}
                      href={`/b/${safeSlug}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${sanitizeText(company.name)} logo`}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#0E0E0E]">
                              {(sanitizeText(company.name)?.trim()?.charAt(0) || "B").toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-semibold text-[#0E0E0E]">{sanitizeText(company.name)}</div>
                            {reviewCount > 0 && (
                              <img
                                src="/brand/Tellacity%20Vefication%20Batch.png"
                                alt="Tellacity verified reviews"
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                          </div>
                          {company.website && <div className="text-xs text-gray-500">{sanitizeText(company.website)}</div>}
                          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                            <RatingStars
                              rating={ratingValue}
                              reviewCount={reviewCount}
                              size={12}
                            />
                            <span>{ratingValue.toFixed(1)}</span>
                            <span className="text-gray-500">
                              ({reviewCount.toLocaleString("en-US")})
                            </span>
                          </div>
                          {(company.category_slug || companyTags.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {company.category_slug && (
                                <span className={businessCategoryPillClassName()}>
                                  {formatBusinessTagLabel(company.category_slug)}
                                </span>
                              )}
                              {companyTags.map((tag, idx) => (
                                <span
                                  key={`${company.id}-${tag}`}
                                  className={businessTagPillClassName(
                                    idx + (company.category_slug ? 1 : 0),
                                  )}
                                >
                                  {formatBusinessTagLabel(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <div className="mt-10 border-t pt-6 text-sm">
            <a
              href={`/companies/${countryCode.toLowerCase()}`}
              className="text-blue-600 hover:underline"
            >
              Browse more businesses in {countryName}
            </a>
          </div>

          {filtersOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                  <h2 className="text-base font-semibold text-[#0E0E0E]">All filters</h2>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600"
                    onClick={() => setFiltersOpen(false)}
                    type="button"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6 px-5 py-5 text-sm text-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-600">Rating</div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[
                        { label: "All", value: null },
                        { label: "3+", value: 3 },
                        { label: "4+", value: 4 },
                        { label: "4.5+", value: 4.5 },
                      ].map((option) => (
                        <button
                          key={option.label}
                          className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                            minRating === option.value
                              ? "border-[#1FAF9E] bg-[#E8F7F5] text-[#0E0E0E]"
                              : "border-gray-300 text-gray-700"
                          }`}
                          onClick={() => {
                            setMinRating(option.value);
                            stripListingPageFromUrl();
                          }}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-600">Location</div>
                    <div className="relative mt-3">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                        onClick={() => setCountryOpen((prev) => !prev)}
                      >
                        <span className="flex items-center gap-2">
                          {selectedCountry ? (
                            <>
                              <img
                                src={COUNTRIES.find((c) => c.code === selectedCountry)?.flagUrl}
                                alt=""
                                className="h-4 w-5 rounded-[2px] object-cover"
                              />
                              {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
                            </>
                          ) : (
                            "Select country"
                          )}
                        </span>
                        <span className="text-gray-400">▼</span>
                      </button>

                      {countryOpen && (
                        <div className="absolute z-10 mt-2 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                          {COUNTRIES.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                updateCountry(country.code);
                                setCountryOpen(false);
                                setFiltersOpen(false);
                              }}
                            >
                              <img src={country.flagUrl} alt="" className="h-4 w-5 rounded-[2px] object-cover" />
                              {sanitizeText(country.name)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {subcategories.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600">Subcategories</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {subcategories.map((category) => {
                          const safeSlug = (category.slug ?? "").trim().toLowerCase();
                          if (!isValidSlug(safeSlug)) return null;
                          return (
                            <Link
                              key={category.id}
                              href={`/categories/${safeSlug}`}
                              className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:border-[#1FAF9E]"
                              onClick={() => setFiltersOpen(false)}
                            >
                              {sanitizeText(category.name)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                  <button className="text-sm font-semibold text-[#1FAF9E]" onClick={resetFilters} type="button">
                    Reset
                  </button>
                  <button
                    className="rounded-full bg-[#1FAF9E] px-5 py-2 text-sm font-semibold text-white"
                    onClick={() => setFiltersOpen(false)}
                    type="button"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

