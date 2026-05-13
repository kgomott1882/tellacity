"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  fetchAndApplyLiveReviewMetrics,
  fetchRecentlyReviewedForCategory,
  type CategoryBusinessRow,
} from "@/lib/categoryListingQueries";
import { comparisonLinks } from "@/lib/comparisonLinks";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { similarBusinessLogoUrl } from "@/lib/logo";
import {
  formatBusinessAddressLines,
  formatDisplayLocationLines,
} from "@/lib/address";
import {
  CATEGORY_DIRECTORY_TAB_ACTIVE_CLASS,
  CATEGORY_DIRECTORY_TAB_LINK_CLASS,
  formatBusinessTagLabel,
  mergeTagsForDisplay,
} from "@/lib/businessTags";
import { getStoredCountry, normalizeCountryCode, setStoredCountry } from "@/lib/country";
import { sanitizeText } from "@/lib/sanitizeText";
import { RefreshCw } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import CategoryInfoTooltip from "@/components/categories/CategoryInfoTooltip";
import { CATEGORY_LISTING_PAGE_SIZE } from "@/lib/categoryListingPageSize";

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

const PAGE_SIZE = CATEGORY_LISTING_PAGE_SIZE;
/** Prefetch window for `/api/category-listings` (same scope as main listing). */
const LISTING_PREFETCH_AHEAD_PAGES = 5;

/** URL uses 1-based `?page=` (omit or 1 = first page). Returns 0-based index for the listing API. */
function listingPageIndexFromSearch(params: URLSearchParams): number {
  const raw = params.get("page");
  const pageNum = Math.max(1, parseInt(String(raw ?? "1"), 10) || 1);
  return pageNum - 1;
}

type CategoryPaginationItem = number | "ellipsis";

/** 1-based current page; returns compact page + ellipsis sequence (directory-style). */
function buildCategoryPaginationItems(
  current1Based: number,
  totalPages: number,
): CategoryPaginationItem[] {
  const t = Math.max(1, totalPages);
  const c = Math.min(Math.max(current1Based, 1), t);
  if (t <= 9) {
    return Array.from({ length: t }, (_, i) => i + 1);
  }
  if (c <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", t];
  }
  if (c >= t - 3) {
    return [1, "ellipsis", t - 3, t - 2, t - 1, t];
  }
  return [1, "ellipsis", c - 1, c, c + 1, "ellipsis", t];
}

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

function toTagSlug(tagName: string): string {
  return tagName.trim().toLowerCase().replace(/\s+/g, "-");
}

function slugForTagChip(raw: string): string | null {
  const s = toTagSlug(raw);
  return isValidSlug(s) ? s : null;
}

function tagBrowseHref(tagSlug: string, country: string): string {
  return `/tags/${encodeURIComponent(tagSlug)}?country=${encodeURIComponent(country)}`;
}

function categoryBrowseHref(catSlug: string, country: string): string {
  return `/categories/${encodeURIComponent(catSlug)}?country=${encodeURIComponent(country)}`;
}

/** Normalize primary `category_slug` for comparisons with URL slug. */
function normalizedCategorySlug(primary: string | null | undefined): string | null {
  const raw = (primary ?? "").trim().toLowerCase();
  if (!raw) return null;
  const hyphenated = toTagSlug(raw);
  return slugForTagChip(hyphenated) ?? slugForTagChip(raw) ?? hyphenated;
}

/** On a category directory page, omit the primary chip when it matches the page (redundant). */
function shouldShowPrimaryCategoryChip(
  listingKind: "category" | "tag",
  pageCategorySlug: string,
  businessPrimary: string | null | undefined,
): boolean {
  const n = normalizedCategorySlug(businessPrimary);
  if (!n || !isValidSlug(n)) return false;
  if (listingKind === "category" && n === pageCategorySlug.trim().toLowerCase()) {
    return false;
  }
  return true;
}

/** Drop keyword chips that duplicate the current category slug on category pages. */
function filterKeywordTagsForPage(
  mergedTags: string[],
  listingKind: "category" | "tag",
  pageSlug: string,
): string[] {
  const pageNorm = pageSlug.trim().toLowerCase();
  if (listingKind !== "category") return mergedTags;
  return mergedTags.filter((tag) => {
    const s = slugForTagChip(tag) ?? toTagSlug(tag.trim().toLowerCase());
    return s !== pageNorm;
  });
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
      label: formatBusinessTagLabel(tag),
      slug: toTagSlug(tag),
    }));
}

function snapshotRpcRating(row: BusinessRow): { trust: number; count: number } {
  const trust =
    (Number(row.trust_score ?? 0) || 0) ||
    (Number(row.average_rating ?? 0) || 0) ||
    (Number(row.avg_rating ?? 0) || 0);
  return { trust, count: Number(row.review_count ?? 0) || 0 };
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
  popularTags?: Array<{ label: string; slug: string }>;
  /** When `tag`, `categorySlug` is a tag slug and listings use `/api/category-listings?kind=tag`. */
  listingKind?: "category" | "tag";
};

export default function CategoryClient({
  categorySlug,
  businesses = [],
  companyCount = 0,
  hasNextPage = false,
  initialCountryCode,
  popularTags: serverPopularTags = [],
  listingKind = "category",
}: CategoryClientProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  const hrefFromMutatedSearchParams = useCallback(
    (params: URLSearchParams) => {
      const s = params.toString();
      if (!pathname) return s ? `?${s}` : "?";
      return s ? `${pathname}?${s}` : pathname;
    },
    [pathname],
  );

  // ---------- LIVE DATA STATE (this was missing) ----------
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rows, setRows] = useState<BusinessRow[]>((businesses ?? []) as BusinessRow[]);
  const [computedCount, setComputedCount] = useState<number>(companyCount ?? 0);
  const [computedHasNext, setComputedHasNext] = useState<boolean>(hasNextPage ?? false);
  // `_isRoutingPagination` intentionally unused: we no longer disable pagination
  // buttons on the pending flag — that was the root cause of "have to click a
  // few times". The transition is still used so the route push is non-blocking.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isRoutingPagination, startPaginationTransition] = useTransition();
  /**
   * The page the user just asked for, held until the URL/router catches up.
   * Used for active highlight and Prev/Next enable so pagination feels instant
   * even while Next.js is still committing the previous navigation. Without this,
   * rapid clicks (e.g. 1 → 3 → 5) get dropped because the active state and
   * disabled flags lag behind the URL.
   */
  const [pendingPageIndex, setPendingPageIndex] = useState<number | null>(null);

  const listingPagePayloadCacheRef = useRef(
    new Map<number, { rows: BusinessRow[]; hasNext: boolean }>(),
  );
  const listingPayloadCacheScopeRef = useRef<string>("");
  const listingPrefetchInflightRef = useRef<Set<number>>(new Set());
  const listingCacheMountSeededRef = useRef(false);

  /**
   * Scroll target for "go to top of listing" on pagination. Anchored to
   * the "Best <category> companies in <country>" heading so users always
   * land at the start of the new page, regardless of how far they scrolled.
   */
  const listingTopRef = useRef<HTMLHeadingElement | null>(null);
  const scrollToListingTop = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (typeof window === "undefined") return;
    const el = listingTopRef.current;
    // Sticky-navbar offset; matches the spacing used elsewhere on the site.
    const NAVBAR_OFFSET = 80;
    if (el) {
      const top =
        el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior });
    } else {
      window.scrollTo({ top: 0, behavior });
    }
  }, []);

  /** Listing page from `?page=` so browser back/forward and shared links preserve pagination. */
  const listingPageIndex = useMemo(
    () => listingPageIndexFromSearch(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  /** Page index the UI should treat as "current" — user's intent first, URL as fallback. */
  const effectivePageIndex = pendingPageIndex ?? listingPageIndex;
  const queryCountry = searchParams.get("country");
  // URL + server-provided country only during render to avoid hydration mismatch.
  const derivedCountry = normalizeCountryCode(
    queryCountry ?? initialCountryCode ?? undefined
  );

  const pushSearchParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      router.push(hrefFromMutatedSearchParams(params), { scroll: false });
    },
    [router, searchParams, hrefFromMutatedSearchParams],
  );

  const hrefForListingPage = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, nextIndex);
      const params = new URLSearchParams(searchParams.toString());
      if (clamped <= 0) params.delete("page");
      else params.set("page", String(clamped + 1));
      return hrefFromMutatedSearchParams(params);
    },
    [searchParams, hrefFromMutatedSearchParams],
  );

  const goToListingPage = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, nextIndex);
      // Compare against the user's last-intended page, not just the URL.
      // Otherwise rapid clicks during a pending transition all collapse to the
      // same target because the URL has not yet caught up.
      const fromIndex = pendingPageIndex ?? listingPageIndex;
      if (clamped === fromIndex) return;

      // Record intent immediately so active highlight and Prev/Next reflect
      // the click before router.push resolves.
      setPendingPageIndex(clamped);

      const scopeKey = `${listingKind}|${categorySlug}|${derivedCountry}`;
      const cached = listingPagePayloadCacheRef.current.get(clamped);
      if (cached && listingPayloadCacheScopeRef.current === scopeKey) {
        // Optimistic paint from in-memory cache to avoid perceived freeze on mobile taps.
        setRows(cached.rows);
        setComputedHasNext(cached.hasNext);
        setFetchError(null);
        setLoading(false);
      } else {
        // Cache miss: show the loading state immediately so the click registers
        // even when the actual fetch will only kick off after the URL updates.
        setLoading(true);
      }

      // Scroll to the top of the listing as soon as the user requests a new
      // page. Done before the route push so the user sees the smooth scroll
      // start immediately, regardless of cache hit/miss or fetch latency.
      scrollToListingTop("smooth");

      const href = hrefForListingPage(clamped);
      startPaginationTransition(() => {
        router.push(href, { scroll: false });
      });
    },
    [
      pendingPageIndex,
      listingPageIndex,
      listingKind,
      categorySlug,
      derivedCountry,
      hrefForListingPage,
      router,
      scrollToListingTop,
    ],
  );

  // Clear the pending intent the moment the URL catches up, so subsequent
  // renders read from `listingPageIndex` again (single source of truth).
  useEffect(() => {
    if (pendingPageIndex !== null && pendingPageIndex === listingPageIndex) {
      setPendingPageIndex(null);
    }
  }, [pendingPageIndex, listingPageIndex]);

  const stripListingPageFromUrl = useCallback(() => {
    pushSearchParams((p) => {
      p.delete("page");
    });
  }, [pushSearchParams]);

  useEffect(() => {
    const candidates = [listingPageIndex + 1, listingPageIndex + 2];
    if (listingPageIndex > 0) candidates.push(listingPageIndex - 1);
    for (const idx of candidates) {
      if (idx < 0) continue;
      const href = hrefForListingPage(idx);
      void router.prefetch(href);
    }
  }, [listingPageIndex, hrefForListingPage, router]);

  const [categoryName, setCategoryName] = useState(() =>
    listingKind === "tag" ? formatBusinessTagLabel(categorySlug) : "",
  );
  const [groupName, setGroupName] = useState("");
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  const sortParam = searchParams.get("sort");
  const currentSort: "rating" | "reviews" | "recent" =
    sortParam === "reviews" ? "reviews" : sortParam === "recent" ? "recent" : "rating";
  const [sortOpen, setSortOpen] = useState(false);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const RECENTLY_REVIEWED_DISPLAY = 3;

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

  const listingTotalPages = useMemo(() => {
    const fromCount = Math.ceil((Number(computedCount) || 0) / PAGE_SIZE);
    if (fromCount >= 1) return Math.max(1, fromCount);
    return Math.max(1, effectivePageIndex + 1 + (computedHasNext ? 1 : 0));
  }, [computedCount, effectivePageIndex, computedHasNext]);

  const listingPaginationItems = useMemo(
    () => buildCategoryPaginationItems(effectivePageIndex + 1, listingTotalPages),
    [effectivePageIndex, listingTotalPages],
  );

  /**
   * Prefer API `hasNext` only when the URL/data have already caught up to the
   * effective page; otherwise trust the count-based total so Next does not
   * incorrectly disable while a pending transition is still in flight.
   */
  const canGoNextListingPage =
    effectivePageIndex === listingPageIndex
      ? computedHasNext || effectivePageIndex + 1 < listingTotalPages
      : effectivePageIndex + 1 < listingTotalPages;

  // URL is source of truth; storage only fills missing URL country.
  useEffect(() => {
    if (!queryCountry && typeof window !== "undefined") {
      const stored = getStoredCountry();
      if (stored) {
        setStoredCountry(stored);
        const params = new URLSearchParams(searchParams.toString());
        params.set("country", stored);
        params.delete("page");
        router.replace(hrefFromMutatedSearchParams(params), { scroll: false });
      }
    }
  }, [queryCountry, searchParams, router, hrefFromMutatedSearchParams]);

  const popularSearches = useMemo(() => {
    if (subcategories.length > 0) return subcategories.slice(0, 8);
    return [];
  }, [subcategories]);

  const [recentlyReviewedRows, setRecentlyReviewedRows] = useState<BusinessRow[]>(
    [],
  );
  const [recentlyReviewedLoading, setRecentlyReviewedLoading] = useState(false);
  const recentReviewRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadRecentlyReviewed = useCallback(async () => {
    const slug = (categorySlug ?? "").trim();
    if (!slug || !derivedCountry) {
      setRecentlyReviewedRows([]);
      return;
    }
    setRecentlyReviewedLoading(true);
    try {
      const { rows: rrRows } = await fetchRecentlyReviewedForCategory(
        supabaseBrowser(),
        slug,
        derivedCountry,
        RECENTLY_REVIEWED_DISPLAY,
        listingKind,
      );
      const rowsCopy = (rrRows ?? []).map((r) => ({ ...r })) as BusinessRow[];
      await fetchAndApplyLiveReviewMetrics(supabaseBrowser(), rowsCopy, {
        preserveOrder: true,
      });
      setRecentlyReviewedRows(rowsCopy);
    } finally {
      setRecentlyReviewedLoading(false);
    }
  }, [categorySlug, derivedCountry, listingKind]);

  useEffect(() => {
    void loadRecentlyReviewed();
  }, [loadRecentlyReviewed]);

  useEffect(() => {
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`recent-reviews-${categorySlug}-${derivedCountry}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          if (recentReviewRefreshTimerRef.current) {
            clearTimeout(recentReviewRefreshTimerRef.current);
          }
          recentReviewRefreshTimerRef.current = setTimeout(() => {
            void loadRecentlyReviewed();
          }, 1200);
        },
      )
      .subscribe();

    return () => {
      if (recentReviewRefreshTimerRef.current) {
        clearTimeout(recentReviewRefreshTimerRef.current);
      }
      void sb.removeChannel(channel);
    };
  }, [loadRecentlyReviewed, categorySlug, derivedCountry]);

  const visiblePopularTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const business of sortedBusinessesList) {
      const tags = mergeTagsForDisplay(
        business.tags,
        business.secondary_category_slugs,
        business.category_slug,
      );
      for (const tag of tags) {
        const normalized = String(tag ?? "").trim().toLowerCase();
        if (!normalized) continue;
        counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }

    return buildPopularTagsFromCounts(counts, 2);
  }, [sortedBusinessesList]);

  const popularTags =
    serverPopularTags.length > 0 ? serverPopularTags : visiblePopularTags;

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

      if (listingKind === "tag") {
        if (isMounted) {
          setCategoryName(formatBusinessTagLabel(categorySlug));
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
  }, [categorySlug, listingKind]);

  // Seed listing cache from SSR payload once per mount (matches URL page).
  useEffect(() => {
    if (listingCacheMountSeededRef.current) return;
    listingCacheMountSeededRef.current = true;
    const scopeKey = `${listingKind}|${categorySlug}|${derivedCountry}`;
    listingPayloadCacheScopeRef.current = scopeKey;
    listingPagePayloadCacheRef.current.set(listingPageIndex, {
      rows: ((businesses ?? []) as BusinessRow[]).map((r) => ({ ...r })),
      hasNext: Boolean(hasNextPage),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only seed aligned with SSR
  }, []);

  // ---------- Listing fetch: skip heavy COUNT (SSR total), prefetch next pages ----------
  useEffect(() => {
    const ac = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      ac.abort();
    }, 28_000);

    const scopeKey = `${listingKind}|${categorySlug}|${derivedCountry}`;
    if (listingPayloadCacheScopeRef.current !== scopeKey) {
      listingPagePayloadCacheRef.current.clear();
      listingPrefetchInflightRef.current.clear();
      listingPayloadCacheScopeRef.current = scopeKey;
    }

    const countryCodeForApi = derivedCountry ?? "US";

    const prefetchAhead = (fromPage: number) => {
      const scopeAtPrefetch = scopeKey;
      const schedule =
        typeof window !== "undefined" && "requestIdleCallback" in window
          ? (fn: () => void) =>
              window.requestIdleCallback(() => {
                fn();
              }, { timeout: 2500 })
          : (fn: () => void) => {
              window.setTimeout(fn, 120);
            };

      schedule(() => {
        for (let delta = 1; delta <= LISTING_PREFETCH_AHEAD_PAGES; delta++) {
          const targetPage = fromPage + delta;
          if (listingPagePayloadCacheRef.current.has(targetPage)) continue;
          if (listingPrefetchInflightRef.current.has(targetPage)) continue;
          listingPrefetchInflightRef.current.add(targetPage);

          const pq = new URLSearchParams();
          pq.set("slug", categorySlug);
          pq.set("country", countryCodeForApi);
          pq.set("page", String(targetPage));
          pq.set("minRating", "0");
          pq.set("mode", "page");
          pq.set("includeCount", "0");
          if (listingKind === "tag") pq.set("kind", "tag");

          void fetch(`/api/category-listings?${pq.toString()}`, {
            cache: "no-store",
          })
            .then(async (res) => {
              listingPrefetchInflightRef.current.delete(targetPage);
              if (listingPayloadCacheScopeRef.current !== scopeAtPrefetch) return;
              const payload = (await res.json()) as {
                rows?: BusinessRow[];
                hasNext?: boolean;
              };
              const list = Array.isArray(payload.rows) ? payload.rows : [];
              listingPagePayloadCacheRef.current.set(targetPage, {
                rows: list as BusinessRow[],
                hasNext: Boolean(payload.hasNext),
              });
            })
            .catch(() => {
              listingPrefetchInflightRef.current.delete(targetPage);
            });
        }
      });
    };

    const fetchBusinesses = async () => {
      if (!categorySlug) return;

      const cached = listingPagePayloadCacheRef.current.get(listingPageIndex);
      if (cached && listingPayloadCacheScopeRef.current === scopeKey) {
        setRows(cached.rows);
        setComputedHasNext(cached.hasNext);
        setFetchError(null);
        setLoading(false);
        prefetchAhead(listingPageIndex);
        return;
      }

      setLoading(true);
      setFetchError(null);

      const offset = listingPageIndex * PAGE_SIZE;
      const q = new URLSearchParams();
      q.set("slug", categorySlug);
      q.set("country", countryCodeForApi);
      q.set("page", String(listingPageIndex));
      q.set("minRating", "0");
      q.set("mode", "page");
      q.set("includeCount", "0");
      if (listingKind === "tag") q.set("kind", "tag");
      try {
        const res = await fetch(`/api/category-listings?${q.toString()}`, {
          cache: "no-store",
          signal: ac.signal,
        });
        const data = (await res.json()) as {
          rows?: BusinessRow[];
          totalCount?: number | null;
          hasNext?: boolean;
          error?: string | null;
        };

        window.clearTimeout(timeoutId);

        if (ac.signal.aborted) return;

        const list = Array.isArray(data.rows) ? data.rows : [];
        if (!res.ok && list.length === 0) {
          setRows([]);
          setComputedCount((prev) => (prev > 0 ? prev : offset));
          setComputedHasNext(false);
          setFetchError("Failed to load businesses.");
          setLoading(false);
          return;
        }

        if (data.error && list.length === 0) {
          setRows([]);
          setComputedCount((prev) => (prev > 0 ? prev : offset));
          setComputedHasNext(false);
          setFetchError(data.error ?? "Failed to load businesses.");
          setLoading(false);
          return;
        }

        const hasNext = Boolean(data.hasNext);
        const sliced = list;

        listingPagePayloadCacheRef.current.set(listingPageIndex, {
          rows: sliced.map((r) => ({ ...r })),
          hasNext,
        });
        prefetchAhead(listingPageIndex);

        setRows(sliced);
        setComputedCount((prev) =>
          typeof data.totalCount === "number" ? data.totalCount : prev,
        );
        setComputedHasNext(hasNext);
        setFetchError(sliced.length > 0 ? null : (data.error ?? null));
        setLoading(false);
      } catch (e) {
        window.clearTimeout(timeoutId);
        if (ac.signal.aborted) {
          if (timedOut) {
            setFetchError("Request timed out. Try again.");
            setLoading(false);
          }
          return;
        }
        console.error("[CategoryClient] fetch listings:", e);
        setFetchError("Failed to load businesses.");
        setLoading(false);
      }
    };

    fetchBusinesses();

    return () => {
      window.clearTimeout(timeoutId);
      ac.abort();
    };
  }, [categorySlug, listingPageIndex, derivedCountry, listingKind]);

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

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${title} Reviews & Ratings`,
    ...(siteUrl && categorySlug
      ? {
          url:
            listingKind === "tag"
              ? `${siteUrl}/tags/${categorySlug}`
              : `${siteUrl}/categories/${categorySlug}`,
        }
      : {}),
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
          {popularSearches.length > 0 && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold text-[#0E0E0E]">Explore related categories</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {popularSearches.map((item) => {
                  const safeSlug = (item.slug ?? "").trim().toLowerCase();
                  if (!isValidSlug(safeSlug)) return null;
                  return (
                    <Link
                      key={item.id}
                      href={categoryBrowseHref(safeSlug, countryCode)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:border-[#1FAF9E]"
                    >
                      <span className="text-gray-500">🔍</span>
                      {sanitizeText(item.name)}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

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
                      router.push(hrefFromMutatedSearchParams(params), { scroll: false });
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
                      router.push(hrefFromMutatedSearchParams(params), { scroll: false });
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
                      router.push(hrefFromMutatedSearchParams(params), { scroll: false });
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
          {fetchError && sortedBusinessesList.length === 0 && (
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

          <h2
            ref={listingTopRef}
            className="text-lg font-semibold mt-6 mb-3 scroll-mt-24"
          >
            Best {categoryName} companies in {countryName}
          </h2>
          {listingKind === "category" && (
            <div className="mb-4">
              <CategoryInfoTooltip categorySlug={categorySlug} />
            </div>
          )}
          <div className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200">
            {sortedBusinessesList.length === 0 && !loading && (
              <div className="px-4 py-6 text-sm text-gray-500">
                <p>
                  {listingKind === "tag"
                    ? "No businesses with this tag yet."
                    : "No businesses listed in this category yet."}
                </p>
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
                const locationLines = (() => {
                  const lines = formatBusinessAddressLines(
                    business.address,
                    business.city,
                    business.country_code,
                  );
                  if (lines.length > 0) return lines;
                  return formatDisplayLocationLines(business.display_location ?? "");
                })();
                const businessTags = mergeTagsForDisplay(
                  business.tags,
                  business.secondary_category_slugs,
                  business.category_slug,
                );
                const keywordTags = filterKeywordTagsForPage(
                  businessTags,
                  listingKind,
                  categorySlug,
                );
                const showPrimaryChip = shouldShowPrimaryCategoryChip(
                  listingKind,
                  categorySlug,
                  business.category_slug,
                );

                const logoUrl = categoryListLogoUrl(business);
                const pageCatNorm = categorySlug.trim().toLowerCase();

                return (
                  <div key={business.id} className="block w-full">
                    <div className="px-4 py-5 transition-colors hover:bg-gray-50 sm:grid sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start sm:gap-x-8">
                      <div className="min-w-0">
                        <Link
                          href={`/b/${safeSlug}`}
                          className="flex gap-4 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1FAF9E]/40"
                        >
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
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

                          <div className="min-w-0 flex-1 text-[#0E0E0E]">
                            <div className="flex items-center gap-1">
                              <div className="truncate text-base font-semibold">{sanitizeText(business.name)}</div>
                              {reviewCount > 0 && (
                                <img
                                  src="/brand/Tellacity%20Vefication%20Batch.png"
                                  alt="Tellacity verified reviews"
                                  className="h-5 w-5 shrink-0"
                                />
                              )}
                            </div>
                            {business.website && (
                              <div className="truncate text-sm text-gray-500">{sanitizeText(business.website)}</div>
                            )}
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                              <RatingStars
                                rating={ratingValue}
                                reviewCount={reviewCount}
                                size={12}
                              />
                              <span className="font-medium text-[#0E0E0E]">{ratingValue.toFixed(1)}</span>
                              <span className="text-gray-500">
                                • {reviewCount.toLocaleString("en-US")} reviews
                              </span>
                            </div>
                          </div>
                        </Link>
                        {(showPrimaryChip || keywordTags.length > 0) && (
                          <div className="mt-3 flex max-w-full flex-wrap gap-1.5 border-t border-gray-50 pt-3 sm:pl-[4.75rem]">
                            {showPrimaryChip &&
                              business.category_slug &&
                              (() => {
                                const slug =
                                  slugForTagChip(business.category_slug) ??
                                  business.category_slug.trim().toLowerCase();
                                if (!isValidSlug(slug)) return null;
                                return (
                                  <Link
                                    href={categoryBrowseHref(slug, countryCode)}
                                    className={CATEGORY_DIRECTORY_TAB_LINK_CLASS}
                                  >
                                    {formatBusinessTagLabel(business.category_slug)}
                                  </Link>
                                );
                              })()}
                            {keywordTags.map((tag) => {
                              const slug = slugForTagChip(tag);
                              if (!slug) return null;
                              const activeTag = listingKind === "tag" && slug === pageCatNorm;
                              return activeTag ? (
                                <span
                                  key={`${business.id}-${tag}`}
                                  className={CATEGORY_DIRECTORY_TAB_ACTIVE_CLASS}
                                  aria-current="page"
                                >
                                  {formatBusinessTagLabel(tag)}
                                </span>
                              ) : (
                                <Link
                                  key={`${business.id}-${tag}`}
                                  href={tagBrowseHref(slug, countryCode)}
                                  className={CATEGORY_DIRECTORY_TAB_LINK_CLASS}
                                >
                                  {formatBusinessTagLabel(tag)}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {locationLines.length > 0 && (
                        <aside className="mt-3 shrink-0 text-sm text-gray-500 sm:mt-0 sm:w-full sm:max-w-[12rem] sm:justify-self-end">
                          <div className="flex flex-col gap-1 sm:items-end sm:text-right">
                            {locationLines.map((line, idx) => (
                              <div
                                key={`${business.id}-loc-${idx}`}
                                className="max-w-full break-words leading-snug"
                              >
                                {sanitizeText(line)}
                              </div>
                            ))}
                          </div>
                        </aside>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>

          {sortedBusinessesList.length > 0 && (
            <div className="mt-6 flex justify-center">
              <nav
                className="flex w-full max-w-full items-stretch overflow-hidden rounded-md border border-neutral-700 bg-white text-sm shadow-sm"
                aria-label="Listing pagination"
              >
                <button
                  type="button"
                  className="touch-manipulation shrink-0 px-3 py-2 font-medium text-neutral-900 sm:px-4 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent hover:bg-sky-50"
                  onClick={() => goToListingPage(effectivePageIndex - 1)}
                  disabled={effectivePageIndex === 0}
                >
                  Previous
                </button>
                <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] sm:overflow-x-visible sm:pb-0">
                  <div className="inline-flex min-h-[2.5rem] items-stretch">
                    {listingPaginationItems.map((item, idx) => {
                      const divider = "border-l border-neutral-300";
                      if (item === "ellipsis") {
                        return (
                          <span
                            key={`e-${idx}`}
                            className={`${divider} flex min-w-[2.25rem] select-none items-center justify-center px-2 py-2 text-neutral-500`}
                            aria-hidden
                          >
                            ...
                          </span>
                        );
                      }
                      const isActive = item === effectivePageIndex + 1;
                      if (isActive) {
                        return (
                          <span
                            key={item}
                            aria-current="page"
                            className={`${divider} relative z-[1] inline-flex min-w-[2.5rem] items-center justify-center bg-sky-50 px-3 py-2 font-semibold text-sky-700 ring-1 ring-inset ring-sky-600`}
                          >
                            {item}
                          </span>
                        );
                      }
                      return (
                        <button
                          key={item}
                          type="button"
                          className={`touch-manipulation ${divider} min-w-[2.5rem] shrink-0 px-3 py-2 font-medium text-neutral-800 hover:bg-sky-50`}
                          onClick={() => goToListingPage(item - 1)}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  className="touch-manipulation shrink-0 border-l border-neutral-300 px-3 py-2 font-medium text-neutral-900 sm:px-4 disabled:cursor-not-allowed disabled:text-neutral-400 disabled:hover:bg-transparent hover:bg-sky-50"
                  onClick={() => goToListingPage(effectivePageIndex + 1)}
                  disabled={!canGoNextListingPage}
                >
                  Next page
                </button>
              </nav>
            </div>
          )}

          {popularTags.length > 0 && (
            <section className="mt-10" aria-label="Popular searches">
              <h2 className="text-sm font-semibold text-[#0E0E0E]">Popular searches</h2>
              <div
                className="mt-3 flex flex-wrap gap-1.5"
                role="tablist"
                aria-label="Popular tag filters"
              >
                {popularTags.map((tag) => {
                  const safe = (tag.slug ?? "").trim().toLowerCase();
                  if (!isValidSlug(safe)) return null;
                  const active = listingKind === "tag" && safe === categorySlug.trim().toLowerCase();
                  return active ? (
                    <span
                      key={tag.slug}
                      role="tab"
                      aria-selected="true"
                      className={CATEGORY_DIRECTORY_TAB_ACTIVE_CLASS}
                    >
                      {tag.label}
                    </span>
                  ) : (
                    <Link
                      key={tag.slug}
                      role="tab"
                      aria-selected="false"
                      href={tagBrowseHref(safe, countryCode)}
                      className={CATEGORY_DIRECTORY_TAB_LINK_CLASS}
                    >
                      {tag.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-10" aria-label="Recently reviewed companies">
            <h2 className="text-sm font-semibold text-[#0E0E0E]">
              Recently reviewed companies
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Up to three businesses in this {listingKind === "tag" ? "tag" : "category"} with the most recently published public reviews in {countryName}. Reviews are included regardless of age.
            </p>

            {recentlyReviewedLoading ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {Array.from({ length: RECENTLY_REVIEWED_DISPLAY }).map((_, i) => (
                  <div
                    key={`recent-sk-${i}`}
                    className="flex animate-pulse gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-gray-200" />
                    <div className="min-w-0 flex-1 space-y-2 py-0.5">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentlyReviewedRows.length > 0 ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {recentlyReviewedRows.map((company) => {
                  const safeSlug = (company.slug ?? "").trim().toLowerCase();
                  if (!isValidSlug(safeSlug)) return null;
                  const reviewCount =
                    Number(company.review_count ?? 0) || 0;
                  const ratingValue = snapshotRpcRating(company).trust;
                  const logoUrl = categoryListLogoUrl(company);
                  return (
                    <Link
                      key={company.id}
                      href={`/b/${safeSlug}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md no-underline text-inherit"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
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
                              {(
                                sanitizeText(company.name)?.trim()?.charAt(0) || "B"
                              ).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="text-sm font-semibold text-[#0E0E0E]">
                              {sanitizeText(company.name)}
                            </div>
                            {reviewCount > 0 && (
                              <img
                                src="/brand/Tellacity%20Vefication%20Batch.png"
                                alt="Tellacity verified reviews"
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                          </div>
                          {company.website && (
                            <div className="text-xs text-gray-500">
                              {sanitizeText(company.website)}
                            </div>
                          )}
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
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                No published reviews match this directory and country yet.
              </p>
            )}
          </section>

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

          <div style={{ marginTop: "40px", fontSize: "14px", lineHeight: "1.6" }}>
            <h2>About {categoryName} businesses</h2>
            <p>
              Explore trusted {categoryName} businesses on Tellacity. Read real customer reviews, compare services, and find the best companies based on authentic feedback.
            </p>
            <p>
              Whether you're looking for reliable providers or sharing your experience, Tellacity helps you make informed decisions across {categoryName} services worldwide.
            </p>
          </div>

          <div className="mt-10 border-t pt-6 text-sm">
            <a
              href={`/companies/${countryCode.toLowerCase()}`}
              className="text-blue-600 hover:underline"
            >
              Browse more businesses in {countryName}
            </a>
          </div>

        </section>
      </main>
    </>
  );
}

