"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  normalizeLogoUrl,
  resolveBusinessLogoViaClient,
  domainFromWebsite,
  getLogoDevUrl,
} from "@/lib/logo";
import { formatBusinessAddress } from "@/lib/address";
import { getActiveCountry, setActiveCountry } from "@/lib/getActiveCountry";
import RatingStars from "@/components/RatingStars";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  trust_score: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  review_count: number;
  category_slug: string | null;
  country_code: string | null;
  address: string | null;
  city: string | null;
  display_location: string | null;
  /** Resolved logo: manual first (RPC), else from resolve-business-logo edge function. */
  resolved_logo_url: string | null;
};

type SortOption = "most-relevant" | "most-reviews" | "most-recent";

type CountryOption = {
  code: string;
  name: string;
  flagUrl: string;
};

const PAGE_SIZE = 10;
const skeletons = Array.from({ length: PAGE_SIZE });
const COUNTRIES: CountryOption[] = [
  {
    code: "US",
    name: "United States",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg",
  },
  {
    code: "GB",
    name: "United Kingdom",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg",
  },
  {
    code: "ZA",
    name: "South Africa",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/ZA.svg",
  },
  {
    code: "AU",
    name: "Australia",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/AU.svg",
  },
  {
    code: "CA",
    name: "Canada",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/CA.svg",
  },
  {
    code: "NZ",
    name: "New Zealand",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/NZ.svg",
  },
  {
    code: "IE",
    name: "Ireland",
    flagUrl:
      "https://purecatamphetamine.github.io/country-flag-icons/3x2/IE.svg",
  },
];

const getDisplayRating = (item: {
  trust_score?: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  review_count?: number | null;
}) => {
  const trustScore =
    typeof item.trust_score === "number" ? item.trust_score : null;
  const averageRating =
    typeof item.average_rating === "number"
      ? item.average_rating
      : typeof item.avg_rating === "number"
      ? item.avg_rating
      : null;

  if (trustScore != null && trustScore > 0) {
    return trustScore;
  }

  if (averageRating != null && averageRating > 0) {
    return averageRating;
  }

  return 0;
};

export default function CategoryPage() {
  const params = useParams<{ category_slug: string }>();
  const categorySlug = params?.category_slug ?? "";
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [subcategories, setSubcategories] = useState<
    { id: string; name: string; slug: string }[]
  >([]);
  const [companyCount, setCompanyCount] = useState(0);
  const [listError, setListError] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("most-relevant");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const RECENT_PAGE_SIZE = 3;

  const popularSearches = useMemo(() => {
    if (subcategories.length > 0) {
      return subcategories.slice(0, 8);
    }
    return [];
  }, [subcategories]);

  const [recentPage, setRecentPage] = useState(0);
  const recentCompanies = useMemo(() => {
    const start = recentPage * RECENT_PAGE_SIZE;
    return businesses.slice(start, start + RECENT_PAGE_SIZE);
  }, [businesses, recentPage]);
  const recentHasPrev = recentPage > 0;
  const recentHasNext =
    (recentPage + 1) * RECENT_PAGE_SIZE < businesses.length;

  const title = useMemo(() => {
    if (categoryName) {
      return categoryName;
    }
    if (!categorySlug) {
      return "Category";
    }
    return categorySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [categorySlug]);

  useEffect(() => {
    let isMounted = true;

    const fetchCategoryInfo = async () => {
      if (!categorySlug) {
        setCategoryName("");
        setGroupName("");
        return;
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("name, group")
        .eq("slug", categorySlug)
        .single();

      if (!isMounted) {
        return;
      }

      if (categoryError || !categoryData) {
        const { data: groupData } = await supabase
          .from("category_groups")
          .select("name")
          .eq("slug", categorySlug)
          .single();
        if (isMounted) {
          setCategoryName(groupData?.name ?? "");
          setGroupName("");
        }
        const { data: related } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("group", categorySlug)
          .order("name", { ascending: true });
        if (isMounted) {
          setSubcategories(related ?? []);
        }
        return;
      }

      setCategoryName(categoryData.name ?? "");

      if (categoryData.group) {
        const { data: groupData } = await supabase
          .from("category_groups")
          .select("name")
          .eq("slug", categoryData.group)
          .single();

        if (isMounted) {
          setGroupName(groupData?.name ?? "");
        }

        const { data: related } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("group", categoryData.group)
          .order("name", { ascending: true });

        if (isMounted) {
          setSubcategories(
            (related ?? []).filter((item) => item.slug !== categorySlug)
          );
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

  useEffect(() => {
    const pageTitle = `${title} Businesses | Tellacity`;
    const description = `Explore top rated businesses in ${title}. Read verified customer feedback on Tellacity.`;

    if (typeof document !== "undefined") {
      document.title = pageTitle;
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", description);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = description;
        document.head.appendChild(meta);
      }
    }
  }, [categorySlug, siteUrl, title]);

  useEffect(() => {
    let isMounted = true;

    const fetchCompanyCount = async () => {
      if (!categorySlug) {
        setCompanyCount(0);
        return;
      }

      const country = getActiveCountry();
      const { data: countData, error: countError } = await supabase.rpc(
        "get_category_business_count",
        {
          p_category_slug: categorySlug,
          p_country_code: country ?? null,
          p_min_rating: minRating,
        }
      );

      if (!isMounted) {
        return;
      }

      if (countError) {
        setCompanyCount(0);
        return;
      }
      const count = typeof countData === "number" ? countData : Number(countData ?? 0);
      setCompanyCount(Number.isFinite(count) ? count : 0);
    };

    const fetchBusinesses = async () => {
      if (!categorySlug) {
        setBusinesses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setListError(null);
      const fetchLimit = PAGE_SIZE + 1;
      const offset = page * PAGE_SIZE;
      let rpcData: unknown = null;
      let rpcError: { message: string } | null = null;
      try {
        const result = await supabase.rpc(
          "get_top_businesses_for_category_global",
          {
            p_category_slug: categorySlug || null,
            p_country_code: null,
            p_min_rating: minRating ?? null,
            p_limit: fetchLimit,
            p_offset: offset,
          }
        );
        rpcData = result.data;
        rpcError = result.error;
      } catch (err) {
        rpcError = { message: err instanceof Error ? err.message : "Failed to load businesses" };
      }

      if (!isMounted) {
        return;
      }

      if (rpcError) {
        setListError(rpcError.message);
        setBusinesses([]);
        setHasNextPage(false);
      } else {
        setListError(null);
        const items = Array.isArray(rpcData) ? rpcData : [];
        const hasNext = items.length > PAGE_SIZE;
        const pageItems = items.slice(0, PAGE_SIZE) as BusinessRow[];
        // Logo: primary from RPC (manual), secondary = edge function resolve-business-logo via Supabase client
        let enriched: BusinessRow[] = pageItems;
        try {
          enriched = await Promise.all(
            pageItems.map(async (row) => {
              let url = (row.resolved_logo_url ?? "").toString().trim() || null;
              if (!url && row.website) {
                const domain = domainFromWebsite(row.website);
                if (domain) {
                  const fromEdge = await resolveBusinessLogoViaClient(supabase, domain);
                  if (fromEdge) url = fromEdge;
                }
              }
              return { ...row, resolved_logo_url: url };
            })
          );
        } catch {
          // Enrichment failed; show RPC data only
        }
        if (!isMounted) return;
        setHasNextPage(hasNext);
        setBusinesses(enriched);
      }

      setIsLoading(false);
    };

    fetchBusinesses();
    fetchCompanyCount();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, page, selectedCountry, minRating]);

  useEffect(() => {
    setPage(0);
  }, [categorySlug]);

  useEffect(() => {
    setRecentPage(0);
  }, [categorySlug]);

  useEffect(() => {
    const stored = getActiveCountry();
    if (stored) {
      setSelectedCountry(stored);
    }

    const handleSync = () => {
      const updated = getActiveCountry();
      setSelectedCountry(updated || null);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("tellacity-country-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("tellacity-country-change", handleSync);
    };
  }, []);

  const updateCountry = (code: string | null) => {
    setSelectedCountry(code);
    setActiveCountry(code);
  };

  const resetFilters = () => {
    setMinRating(null);
    updateCountry(null);
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${title} Reviews & Ratings`,
    ...(siteUrl && categorySlug
      ? { url: `${siteUrl}/categories/${categorySlug}` }
      : {}),
    ...(businesses.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            itemListElement: businesses.slice(0, 10).map((business, index) => ({
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionJsonLd),
        }}
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
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            Best in {title}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Top rated businesses in this category
          </p>
          <p className="mt-3 mb-6 max-w-2xl text-sm text-gray-600">
            Browse verified customer reviews for {title} businesses. Compare ratings, read experiences, and share your
            feedback on Tellacity. Helping South Africans choose trusted {title} companies.
          </p>
        </div>

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
                  <div className="text-xs font-semibold text-gray-600">
                    Rating
                  </div>
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
            Companies (
            {companyCount > 0
              ? companyCount.toLocaleString()
              : businesses.length > 0
                ? `${(page * PAGE_SIZE + businesses.length).toLocaleString()}+`
                : "0"}
            )
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
                {sortOption === "most-relevant"
                  ? "Most relevant"
                  : sortOption === "most-reviews"
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
                    setSortOption("most-relevant");
                    setSortOpen(false);
                  }}
                  type="button"
                >
                  <span
                    className={`mt-0.5 h-4 w-4 rounded-full border ${
                      sortOption === "most-relevant"
                        ? "border-[#1FAF9E] bg-[#1FAF9E]"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <span>
                    <span className="block font-medium text-gray-900">
                      Most relevant
                    </span>
                    <span className="block text-xs text-gray-500">
                      Sorting by relevance shows all companies that are best in
                      a category, ordered by TrustScore and review count.
                    </span>
                  </span>
                </button>
                <button
                  className="mt-2 flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                  onClick={() => {
                    setSortOption("most-reviews");
                    setSortOpen(false);
                  }}
                  type="button"
                >
                  <span
                    className={`mt-0.5 h-4 w-4 rounded-full border ${
                      sortOption === "most-reviews"
                        ? "border-[#1FAF9E] bg-[#1FAF9E]"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <span className="font-medium text-gray-900">
                    Highest number of reviews
                  </span>
                </button>
                <button
                  className="mt-2 flex w-full items-start gap-3 rounded-md p-2 text-left hover:bg-gray-50"
                  onClick={() => {
                    setSortOption("most-recent");
                    setSortOpen(false);
                  }}
                  type="button"
                >
                  <span
                    className={`mt-0.5 h-4 w-4 rounded-full border ${
                      sortOption === "most-recent"
                        ? "border-[#1FAF9E] bg-[#1FAF9E]"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  <span className="font-medium text-gray-900">
                    Most recent reviews
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200">
          {isLoading &&
            skeletons.map((_, index) => (
              <div
                key={`business-skeleton-${index}`}
                className="flex flex-wrap items-center gap-4 px-4 py-5"
              >
                <div className="h-12 w-12 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-100" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                </div>
                <div className="h-4 w-24 rounded bg-gray-100" />
              </div>
            ))}

          {!isLoading && businesses.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">
              {listError ? (
                <p className="text-red-600">
                  Failed to load list: {listError}
                </p>
              ) : (
                <p>No businesses listed in this category yet.</p>
              )}
              <Link
                href="/categories"
                className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                Browse all categories
              </Link>
            </div>
          )}

          {!isLoading &&
            [...businesses]
              .sort((a, b) => {
                if (sortOption === "most-reviews") {
                  return (b.review_count ?? 0) - (a.review_count ?? 0);
                }
                if (sortOption === "most-recent") {
                  return a.name.localeCompare(b.name);
                }
                return 0;
              })
              .map((business) => {
              const ratingValue = getDisplayRating(business);
              const locationText =
                formatBusinessAddress(
                  business.address,
                  business.city,
                  business.country_code
                ) || business.display_location;
              const logoUrl =
                normalizeLogoUrl(business.resolved_logo_url) ??
                getLogoDevUrl(domainFromWebsite(business.website));

              return (
                <Link
                  key={business.id}
                  href={`/b/${business.slug}`}
                  className="block w-full"
                >
                  <div className="flex items-center justify-between gap-6 px-4 py-5 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${business.name} logo`}
                            className="absolute inset-0 h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-[#0E0E0E] truncate">
                          {business.name}
                        </div>
                        {business.website && (
                          <div className="text-sm text-gray-500 truncate">
                            {business.website}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                          <RatingStars rating={ratingValue} size={12} />
                          <span className="font-medium text-[#0E0E0E]">
                            {ratingValue.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            • {(business.review_count ?? 0).toLocaleString()} reviews
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 text-right min-w-[180px]">
                      {locationText}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>

        {!isLoading && businesses.length > 0 && (
          <div className="mt-6 flex items-center justify-center text-sm text-gray-600">
            <div className="inline-flex overflow-hidden rounded-md border border-gray-300">
              <button
                className="px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
              >
                Previous
              </button>
              <span className="border-l border-gray-300 px-4 py-2 font-semibold text-gray-800">
                Page {page + 1}
              </span>
              <button
                className="border-l border-gray-300 px-4 py-2 font-semibold text-gray-700 disabled:cursor-not-allowed disabled:text-gray-400"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasNextPage}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {!isLoading && businesses.length > 0 && !hasNextPage && page > 0 && (
          <p className="mt-3 text-center text-sm text-gray-500">
            End of results. Go back to the previous page.
          </p>
        )}

        {popularSearches.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-semibold text-[#0E0E0E]">
              Popular searches
            </h2>
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

        {recentCompanies.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#0E0E0E]">
                Recently reviewed companies
              </h2>
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
                const ratingValue = getDisplayRating(company);
                const logoUrl =
                  normalizeLogoUrl(company.resolved_logo_url) ??
                  getLogoDevUrl(domainFromWebsite(company.website));
                return (
                  <Link
                    key={company.id}
                    href={`/b/${company.slug}`}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={`${company.name} logo`}
                            className="absolute inset-0 h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#0E0E0E]">
                          {company.name}
                        </div>
                        {company.website && (
                          <div className="text-xs text-gray-500">
                            {company.website}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <RatingStars rating={ratingValue} size={12} />
                          <span>{ratingValue.toFixed(1)}</span>
                          <span className="text-gray-500">
                            ({(company.review_count ?? 0).toLocaleString()})
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
      </section>
      </main>
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-base font-semibold text-[#0E0E0E]">
                All filters
              </h2>
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
                      onClick={() => setMinRating(option.value)}
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
                            src={
                              COUNTRIES.find(
                                (country) => country.code === selectedCountry
                              )?.flagUrl
                            }
                            alt=""
                            className="h-4 w-5 rounded-[2px] object-cover"
                          />
                          {
                            COUNTRIES.find(
                              (country) => country.code === selectedCountry
                            )?.name
                          }
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
                          }}
                        >
                          <img
                            src={country.flagUrl}
                            alt=""
                            className="h-4 w-5 rounded-[2px] object-cover"
                          />
                          {country.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-600">
                  Company status
                </div>
                <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" />
                  <span>
                    <span className="font-medium">Claimed</span>
                    <span className="block text-xs text-gray-500">
                      Companies that have claimed their Tellacity profile.
                    </span>
                  </span>
                </label>
              </div>

              {subcategories.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-600">
                    Subcategories
                  </div>
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
              <button
                className="text-sm font-semibold text-[#1FAF9E]"
                onClick={resetFilters}
                type="button"
              >
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
    </>
  );
}
