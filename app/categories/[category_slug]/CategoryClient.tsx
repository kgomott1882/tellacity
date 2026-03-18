"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { comparisonLinks } from "@/lib/comparisonLinks";
import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl, domainFromWebsite, getLogoDevUrl } from "@/lib/logo";
import { formatBusinessAddress } from "@/lib/address";
import { getActiveCountry, setActiveCountry } from "@/lib/getActiveCountry";
import RatingStars from "@/components/RatingStars";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  trust_score: number | null;
  review_count: number;
  category_slug: string | null;
  country_code: string | null;
  address: string | null;
  city: string | null;
  display_location: string | null;
  resolved_logo_url: string | null;
};

type CountryOption = {
  code: string;
  name: string;
  flagUrl: string;
};

const PAGE_SIZE = 10;

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

  const [page, setPage] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const currentSort = searchParams.get("sort") ?? "relevant";
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);

  const queryCountry = searchParams.get("country");
  // Sync with nav/footer: URL param first, then localStorage (getActiveCountry), then server default
  const storedCountry =
    typeof window !== "undefined" ? getActiveCountry() : null;
  const derivedCountry =
    queryCountry ?? storedCountry ?? initialCountryCode ?? "ZA";

  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    derivedCountry
  );
  const [countryOpen, setCountryOpen] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const RECENT_PAGE_SIZE = 3;

  const businessesList = rows ?? [];

  // Keep selectedCountry in sync with URL and global country
  useEffect(() => {
    setSelectedCountry(derivedCountry);
    setPage(0);
  }, [derivedCountry, categorySlug]);

  // When no URL country param, apply stored country from nav/footer so all three stay in sync
  useEffect(() => {
    if (!queryCountry && typeof window !== "undefined") {
      const stored = getActiveCountry();
      if (stored) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("country", stored);
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }
  }, [queryCountry, searchParams, router]);

  // When user changes country in nav or footer, update this page's URL and selection
  useEffect(() => {
    const handler = () => {
      const code = getActiveCountry();
      const params = new URLSearchParams(searchParams.toString());
      if (code) {
        params.set("country", code);
      } else {
        params.delete("country");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
      setSelectedCountry(code ?? initialCountryCode ?? "ZA");
      setPage(0);
    };
    window.addEventListener("tellacity-country-change", handler);
    return () => window.removeEventListener("tellacity-country-change", handler);
  }, [searchParams, router, initialCountryCode]);

  const popularSearches = useMemo(() => {
    if (subcategories.length > 0) return subcategories.slice(0, 8);
    return [];
  }, [subcategories]);

  const [recentPage, setRecentPage] = useState(0);
  const recentCompanies = useMemo(() => {
    const start = recentPage * RECENT_PAGE_SIZE;
    return businessesList.slice(start, start + RECENT_PAGE_SIZE);
  }, [businessesList, recentPage]);

  const recentHasPrev = recentPage > 0;
  const recentHasNext = (recentPage + 1) * RECENT_PAGE_SIZE < businessesList.length;

  const title = useMemo(() => {
    if (categoryName) return categoryName;
    if (!categorySlug) return "Category";
    return categorySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [categorySlug, categoryName]);

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

      const offset = page * PAGE_SIZE;
      const countryCode = derivedCountry ?? "ZA";
      const min = typeof minRating === "number" ? minRating : 0;

      const supabase = supabaseBrowser();
      const [businessesResult, countResult] = await Promise.all([
        supabase.rpc("get_top_businesses_for_category_global", {
          p_category_slug: categorySlug,
          p_country_code: countryCode,
          p_min_rating: min,
          p_limit: PAGE_SIZE + 1, // fetch one extra to detect next page
          p_offset: offset,
        }),
        supabase.rpc("get_category_business_count", {
          p_category_slug: categorySlug,
          p_country_code: countryCode,
          p_min_rating: min,
        }),
      ]);

      const { data, error } = businessesResult;

      if (!isMounted) return;

      if (error) {
        setRows([]);
        setComputedCount(0);
        setComputedHasNext(false);
        setFetchError(error.message ?? "Failed to load businesses.");
        setLoading(false);
        return;
      }

      const totalCount =
        typeof countResult.data === "number"
          ? countResult.data
          : (Number(countResult.data ?? 0)) || 0;

      const list = (data ?? []) as BusinessRow[];
      const hasNext = list.length > PAGE_SIZE;
      const sliced = hasNext ? list.slice(0, PAGE_SIZE) : list;

      // Recompute live metrics from published reviews so that
      // ratings and ordering always reflect the latest data.
      try {
        const ids = sliced.map((row) => row.id).filter(Boolean);
        if (ids.length > 0) {
          const { data: reviews, error: reviewError } = await supabase
            .from("reviews")
            .select("business_id, rating")
            .in("business_id", ids)
            .eq("status", "published");

          if (!reviewError && reviews) {
            const agg: Record<string, { count: number; sum: number }> = {};
            for (const row of reviews as any[]) {
              const id = String(row.business_id);
              const rating = Number(row.rating ?? 0);
              if (!agg[id]) agg[id] = { count: 0, sum: 0 };
              if (rating > 0) {
                agg[id].count += 1;
                agg[id].sum += rating;
              }
            }

            // Sort by live rating desc, then review count desc, then name.
            sliced.sort((a, b) => {
              const aAgg = agg[a.id] ?? { count: 0, sum: 0 };
              const bAgg = agg[b.id] ?? { count: 0, sum: 0 };
              const aRating =
                aAgg.count > 0 ? aAgg.sum / aAgg.count : (Number(a.trust_score ?? 0)) || 0;
              const bRating =
                bAgg.count > 0 ? bAgg.sum / bAgg.count : (Number(b.trust_score ?? 0)) || 0;
              const aCount =
                aAgg.count > 0 ? aAgg.count : (Number(a.review_count ?? 0)) || 0;
              const bCount =
                bAgg.count > 0 ? bAgg.count : (Number(b.review_count ?? 0)) || 0;

              if (bRating !== aRating) return bRating - aRating;
              if (bCount !== aCount) return bCount - aCount;
              return (a.name || "").localeCompare(b.name || "");
            });

            // Override stale metrics so UI never shows ratings
            // that don't match published reviews.
            sliced.forEach((row) => {
              const m = agg[row.id];
              if (m && m.count > 0) {
                row.trust_score = m.sum / m.count;
                row.review_count = m.count;
              } else {
                row.trust_score = 0;
                row.review_count = 0 as any;
              }
            });
          }
        }
      } catch {
        // If live recompute fails, fall back to RPC ordering/metrics.
      }

      setRows(sliced);
      setComputedCount(totalCount);
      setComputedHasNext(hasNext);
      setLoading(false);
    };

    fetchBusinesses();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, page, minRating, derivedCountry]);

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
    setActiveCountry(code);
    const params = new URLSearchParams(searchParams.toString());
    if (code) params.set("country", code);
    else params.delete("country");
    router.push(`?${params.toString()}`);
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
    ...(businessesList.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: businessesList.slice(0, 10).map((business, index) => ({
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
          <nav className="text-sm text-gray-500">
            <span>Categories</span>
            {groupName && (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-500">{groupName}</span>
              </>
            )}
            <span className="mx-2">›</span>
            <span className="text-gray-700">{title}</span>
          </nav>

          <div className="mt-4">
            <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
              {title} Reviews in {COUNTRIES.find((c) => c.code === derivedCountry)?.name ?? derivedCountry ?? "South Africa"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">Top rated {title} companies based on verified customer reviews.</p>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Browse verified customer reviews for {title} companies. Compare ratings, read real customer experiences, and discover the top rated {title} providers before choosing who to trust.
            </p>
          </div>

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
                          setPage(0);
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
              Companies ({computedCount > 0 ? computedCount.toLocaleString("en-US") : businessesList.length.toLocaleString("en-US")})
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
                  {currentSort === "relevant"
                    ? "Most relevant"
                    : currentSort === "reviews"
                    ? "Highest number of reviews"
                    : "Most recent reviews"}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {sortOpen && (
                <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-lg">
                  <button
                    className="flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("sort", "relevant");
                      router.push(`?${params.toString()}`, { scroll: false });
                      setSortOpen(false);
                    }}
                    type="button"
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded-full border ${
                        currentSort === "relevant" ? "border-[#1FAF9E] bg-[#1FAF9E]" : "border-gray-300 bg-white"
                      }`}
                    />
                    <span>
                      <span className="block font-medium text-gray-900">Most relevant</span>
                      <span className="block text-xs text-gray-500">
                        Sorting by relevance shows all companies that are best in a category, ordered by TrustScore and review count.
                      </span>
                    </span>
                  </button>

                  <button
                    className="mt-2 flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("sort", "reviews");
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
                    <span className="font-medium text-gray-900">Most recent reviews</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Loading / error (minimal) */}
          {loading && <p className="mt-6 text-sm text-gray-500">Loading businesses…</p>}
          {fetchError && <p className="mt-2 text-sm text-red-600">{fetchError}</p>}

          <div className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200">
            {businessesList.length === 0 && !loading && (
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

            {businessesList.length > 0 &&
              businessesList.map((business) => {
                const reviewCount = (Number(business.review_count ?? 0)) || 0;
                const ratingValue =
                  typeof business.trust_score === "number" && business.trust_score > 0
                    ? business.trust_score
                    : 0;
                const locationText =
                  formatBusinessAddress(business.address, business.city, business.country_code) ||
                  business.display_location;

                const logoUrl =
                  normalizeLogoUrl(business.resolved_logo_url) ?? getLogoDevUrl(domainFromWebsite(business.website));

                return (
                  <Link key={business.id} href={`/b/${business.slug}`} className="block w-full">
                      <div className="flex flex-col gap-3 px-4 py-5 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${business.name} logo`}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-base font-semibold text-[#0E0E0E] truncate">{business.name}</div>
                            {reviewCount > 0 && (
                              <img
                                src="/brand/Tellacity%20Vefication%20Batch.png"
                                alt="Tellacity verified reviews"
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                          </div>
                          {business.website && <div className="text-sm text-gray-500 truncate">{business.website}</div>}
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
                          {locationText && (
                            <div className="mt-1 text-xs text-gray-500 sm:hidden">
                              {locationText}
                            </div>
                          )}
                        </div>
                      </div>

                      {locationText && (
                        <div className="hidden text-sm text-gray-500 sm:block sm:text-right sm:min-w-[180px]">
                          {locationText}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
          </div>

          {businessesList.length > 0 && (
            <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
              <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
                <button
                  className="px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                  onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="border-l border-gray-300 px-4 py-2 font-semibold text-gray-800">Page {page + 1}</span>
                <button
                  className="border-l border-gray-300 px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={!computedHasNext}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {popularSearches.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold text-[#0E0E0E]">Popular searches</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {popularSearches.map((item) => (
                  <Link
                    key={item.id}
                    href={`/categories/${item.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-[#1FAF9E]"
                  >
                    <span className="text-gray-500">🔍</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {subcategories.length > 0 && (
            <div className="mt-12">
              <h3 className="text-lg font-semibold text-[#0E0E0E] mb-4">
                Explore related categories
              </h3>
              <div className="flex flex-wrap gap-3">
                {subcategories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}?country=${derivedCountry ?? "ZA"}`}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-[#1FAF9E] hover:bg-gray-50"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
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
                  const reviewCount = (Number(company.review_count ?? 0)) || 0;
                  const ratingValue =
                    typeof company.trust_score === "number" && company.trust_score > 0
                      ? company.trust_score
                      : 0;
                  const logoUrl =
                    normalizeLogoUrl(company.resolved_logo_url) ?? getLogoDevUrl(domainFromWebsite(company.website));

                  return (
                    <Link
                      key={company.id}
                      href={`/b/${company.slug}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${company.name} logo`}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-semibold text-[#0E0E0E]">{company.name}</div>
                            {reviewCount > 0 && (
                              <img
                                src="/brand/Tellacity%20Vefication%20Batch.png"
                                alt="Tellacity verified reviews"
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                          </div>
                          {company.website && <div className="text-xs text-gray-500">{company.website}</div>}
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
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

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
                            setPage(0);
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
                                setPage(0);
                              }}
                            >
                              <img src={country.flagUrl} alt="" className="h-4 w-5 rounded-[2px] object-cover" />
                              {country.name}
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
                        {subcategories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:border-[#1FAF9E]"
                            onClick={() => setFiltersOpen(false)}
                          >
                            {category.name}
                          </Link>
                        ))}
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
