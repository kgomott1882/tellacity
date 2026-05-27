"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import RecentReviewCard from "@/components/reviews/RecentReviewCard";
import RotatingBestCategorySection from "@/components/home/RotatingBestCategorySection";
import HeroStarField, {
  type HeroStarFieldHandle,
} from "@/components/home/HeroStarField";
import BusinessSearchInput from "@/components/search/BusinessSearchInput";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/MotionWrapper";
import {
  normalizeCountryCode as normalizeCountryCodeLib,
} from "@/lib/country";
import { similarBusinessLogoUrl } from "@/lib/logo";
import { getAllBlogPosts } from "../data/blogPosts";
import {
  clearHomeFeedHighlight,
  readHomeFeedHighlight,
} from "@/lib/homeFeedHighlight";
import { cn } from "@/lib/utils";
import {
  HOME_MARQUEE_CATEGORY_ITEMS,
  buildMarqueeCategoryCards,
  type HomeMarqueeCategoryCard,
} from "@/lib/homeMarqueeCategories";
import { useUnifiedCountry } from "@/lib/useUnifiedCountry";
import type { HomeBestInBusiness } from "@/lib/homeBestInBundle";
import { CAROUSEL_NAV_BUTTON_CLASS } from "@/lib/carouselNavButton";
import { CarouselNavChevron } from "@/components/ui/CarouselNavChevron";
import FaqAccordionList from "@/components/faq/FaqAccordionList";
import { buildFaqJsonLd } from "@/lib/faqItems";

type HomeReview = {
  review_id: string;
  rating: number | null;
  title?: string | null;
  body: string | null;
  created_at: string | null;
  guest_name: string | null;
  reviewer_name?: string | null;
  business_name: string | null;
  business_slug: string | null;
  website: string | null;
  website_display?: string | null;
  logo_url?: string | null;
  resolved_logo_url: string | null;
  /** Used for verification badge next to business name (same logic as category cards). */
  review_count?: number | null;
  like_count?: number | null;
  product_photo_id?: string | null;
  product_name?: string | null;
};

/** Logo resolution from businesses.logo_url only. */
function mapHomeFeedRowToHomeReview(row: Record<string, unknown>): HomeReview {
  const website =
    typeof row.website === "string" && row.website.trim() !== ""
      ? row.website
      : null;
  const websiteDisplay =
    typeof row.website_display === "string" && row.website_display.trim() !== ""
      ? row.website_display
      : null;
  const logoUrl =
    row.logo_url != null && String(row.logo_url).trim() !== ""
      ? String(row.logo_url)
      : null;
  const resolved_logo_url = similarBusinessLogoUrl({
    logo_url: logoUrl,
  });

  return {
    review_id: String(row.review_id ?? ""),
    rating: (row.rating as number) ?? null,
    title: (row.title as string) ?? null,
    body: (row.body as string) ?? null,
    created_at: (row.created_at as string) ?? null,
    guest_name: (row.guest_name as string) ?? null,
    reviewer_name: (row.reviewer_name as string) ?? (row.guest_name as string) ?? null,
    business_name: (row.business_name as string) ?? null,
    business_slug: (row.business_slug as string) ?? null,
    website,
    website_display: websiteDisplay,
    logo_url: logoUrl,
    resolved_logo_url,
    review_count: row.review_count != null ? Number(row.review_count) : null,
    like_count: row.like_count != null ? Number(row.like_count) : null,
    product_photo_id:
      typeof row.product_photo_id === "string" && row.product_photo_id.trim() !== ""
        ? row.product_photo_id
        : null,
    product_name:
      typeof row.product_name === "string" && row.product_name.trim() !== ""
        ? row.product_name
        : null,
  };
}

/** Max reviews in Recent reviews carousel (desktop pages of 8; mobile horizontal strip). */
const HOME_FEED_DISPLAY_LIMIT = 64;

function sortHomeFeedRowsByDateDesc(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const ta = new Date(String(a.created_at ?? 0)).getTime();
    const tb = new Date(String(b.created_at ?? 0)).getTime();
    return tb - ta;
  });
}

/** Align with `normalizeCountryCode` / DB (e.g. UK → GB). */
function feedRowCountryMatches(
  row: Record<string, unknown>,
  selectedCode: string,
): boolean {
  const raw = row.country_code;
  const c = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!c) return false;
  const normalized = c === "UK" ? "GB" : c;
  return normalized === selectedCode;
}

const cleanDomain = (value: string | null | undefined) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

const FLAG_BASE = "https://purecatamphetamine.github.io/country-flag-icons/3x2";
const COUNTRIES = [
  { code: "ZA", name: "South Africa", flagUrl: `${FLAG_BASE}/ZA.svg` },
  { code: "US", name: "United States", flagUrl: `${FLAG_BASE}/US.svg` },
  { code: "GB", name: "United Kingdom", flagUrl: `${FLAG_BASE}/GB.svg` },
  { code: "AU", name: "Australia", flagUrl: `${FLAG_BASE}/AU.svg` },
  { code: "CA", name: "Canada", flagUrl: `${FLAG_BASE}/CA.svg` },
  { code: "NZ", name: "New Zealand", flagUrl: `${FLAG_BASE}/NZ.svg` },
  { code: "IE", name: "Ireland", flagUrl: `${FLAG_BASE}/IE.svg` },
] as const;

type CountryCode = (typeof COUNTRIES)[number]["code"];

/** Same allow-list as `@/lib/country`; keeps flags + RPC country aligned. */
function normalizeHomeCountry(code: string | null | undefined): CountryCode {
  return normalizeCountryCodeLib(code) as CountryCode;
}

function isSafeCategorySlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const s = slug.trim();
  if (s.length < 1 || s.length > 120) return false;
  if (s.includes("/") || s.includes("?") || s.includes("#") || s.includes("..")) {
    return false;
  }
  return true;
}

/** Homepage Best-in row (live scores via `loadHomeBestInLive`); alias for bundle type. */
export type BestInBusiness = HomeBestInBusiness;

type HomePageClientProps = {
  initialSelectedCountry: string | null;
  /**
   * True when the user landed on `/` with no `?country=` param. Drives the
   * country-agnostic hero/H2/About copy and matching JSON-LD. Once the user
   * picks a country from the dropdown we flip this to false so country-aware
   * copy takes over without a server roundtrip.
   */
  initialIsGlobalHome?: boolean;
  rotatingCategorySlugs: string[];
  bestInByCategory: Record<string, BestInBusiness[]>;
  bestInCategoryLabels: Record<string, string>;
  /** Server-validated marquee tiles; falls back to static list if empty. */
  marqueeCategories?: HomeMarqueeCategoryCard[];
  /** Recent reviews from SSR (same query as GET /api/home-feed). */
  initialHomeFeedRows?: Record<string, unknown>[];
};

export default function HomePageClient({
  initialSelectedCountry = null,
  initialIsGlobalHome = false,
  rotatingCategorySlugs = [],
  bestInByCategory = {},
  bestInCategoryLabels = {},
  marqueeCategories: marqueeCategoriesProp,
  initialHomeFeedRows = [],
}: HomePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [homeFeedRawRows, setHomeFeedRawRows] = useState<
    Record<string, unknown>[]
  >(() =>
    sortHomeFeedRowsByDateDesc(
      Array.isArray(initialHomeFeedRows) ? [...initialHomeFeedRows] : [],
    ),
  );
  const isLoading = false;
  const error: string | null = null;
  const [reviewPage, setReviewPage] = useState(0);
  const [highlightedReviewId, setHighlightedReviewId] = useState<
    string | null
  >(null);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [isGlobalHome, setIsGlobalHome] = useState<boolean>(
    Boolean(initialIsGlobalHome),
  );
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const reviewsScrollRef = useRef<HTMLDivElement | null>(null);
  const recentReviewsSectionRef = useRef<HTMLElement | null>(null);
  const homeHighlightClearTimerRef = useRef<number | null>(null);
  const heroStarFieldRef = useRef<HeroStarFieldHandle | null>(null);
  const [bestInIndex, setBestInIndex] = useState(0);
  const bestInCountryPrevRef = useRef<string | null>(null);
  /** Set only after a successful `/api/home-best-in` (or SSR skip). */
  const lastCompletedBestInKeyRef = useRef<string | null>(null);
  const bestInFetchGenRef = useRef(0);
  const [clientBestInByCategory, setClientBestInByCategory] =
    useState<Record<string, BestInBusiness[]>>(bestInByCategory ?? {});
  /** Set only after a successful `/api/home-feed` fetch (or SSR skip on initial). */
  const lastCompletedHomeFeedKeyRef = useRef<string | null>(null);
  const homeFeedFetchGenRef = useRef(0);

  const { countryCode, setCountryAndSync } = useUnifiedCountry({
    initialCountry: initialSelectedCountry,
    ensureQueryParam: true,
    preferWindowSearchOnRoot: true,
  });
  const activeCountryCode = normalizeHomeCountry(countryCode);
  const activeCountry =
    COUNTRIES.find((country) => country.code === activeCountryCode) ??
    COUNTRIES[0];

  /** Stable primitive for hooks. Avoids effect dependency array length and identity churn. */
  const rotatingBestInSlugsKey = useMemo(() => {
    if (!Array.isArray(rotatingCategorySlugs)) return "";
    return rotatingCategorySlugs
      .map((s) => String(s ?? "").trim().toLowerCase())
      .filter(Boolean)
      .join("|");
  }, [rotatingCategorySlugs]);

  const bestInEffectSyncKey = useMemo(
    () =>
      `${pathname}::${activeCountryCode}::${rotatingBestInSlugsKey}::${String(initialSelectedCountry ?? "")}`,
    [pathname, activeCountryCode, rotatingBestInSlugsKey, initialSelectedCountry],
  );

  const marqueeItems = useMemo(() => {
    if (marqueeCategoriesProp && marqueeCategoriesProp.length > 0) {
      return marqueeCategoriesProp;
    }
    return buildMarqueeCategoryCards(HOME_MARQUEE_CATEGORY_ITEMS);
  }, [marqueeCategoriesProp]);

  const categoryBrowseHref = useCallback(
    (slug: string) => {
      const s = (slug ?? "").trim().toLowerCase();
      return `/categories/${s}?country=${encodeURIComponent(activeCountryCode)}`;
    },
    [activeCountryCode],
  );

  const reviews = useMemo(
    () =>
      sortHomeFeedRowsByDateDesc(
        homeFeedRawRows.filter((r) =>
          feedRowCountryMatches(r, activeCountryCode),
        ),
      )
        .slice(0, HOME_FEED_DISPLAY_LIMIT)
        .map((r) => mapHomeFeedRowToHomeReview(r)),
    [homeFeedRawRows, activeCountryCode],
  );

  const latestBlogPost = useMemo(() => {
    const posts = getAllBlogPosts();
    const post = posts[0];
    if (!post) return null;
    return {
      title: post.title,
      description: post.description,
      category: post.category ?? "Blog",
      href: `/blog/${post.slug}`,
      imageSrc: post.thumbnail ?? "",
      imageAlt: post.title,
    };
  }, []);

  useEffect(() => {
    if (!rotatingCategorySlugs || rotatingCategorySlugs.length === 0) {
      return;
    }
    setBestInIndex(0);
    const id = window.setInterval(() => {
      setBestInIndex((prev) =>
        rotatingCategorySlugs.length === 0
          ? 0
          : (prev + 1) % rotatingCategorySlugs.length
      );
    }, 180000);
    return () => window.clearInterval(id);
  }, [rotatingCategorySlugs]);

  const handleCountryChange = (code: CountryCode) => {
    setCountryAndSync(code);
    setIsCountryMenuOpen(false);
    if (isGlobalHome) setIsGlobalHome(false);
  };

  const reviewsPerPage = 8;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const visibleReviews = reviews.slice(
    reviewPage * reviewsPerPage,
    reviewPage * reviewsPerPage + reviewsPerPage
  );
  // Single review-card source; both mobile and desktop reuse this.
  const reviewCards = useMemo(
    () =>
      reviews.map((review) => (
        <div
          key={review.review_id}
          className="transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
        >
          <RecentReviewCard
            review={review}
            showMoreAndReply={false}
            variant="landing"
            highlight={highlightedReviewId === review.review_id}
          />
        </div>
      )),
    [reviews, highlightedReviewId],
  );
  const visibleReviewCards = useMemo(
    () =>
      reviewCards.slice(
        reviewPage * reviewsPerPage,
        reviewPage * reviewsPerPage + reviewsPerPage,
      ),
    [reviewCards, reviewPage, reviewsPerPage],
  );
  // Mobile: one horizontal strip of all reviews (pairs of 2 cards) for swipe + prev/next
  const allReviewPairCards = useMemo(() => {
    const pairs: [React.ReactNode | null, React.ReactNode | null][] = [];
    for (let i = 0; i < reviewCards.length; i += 2) {
      pairs.push([reviewCards[i] ?? null, reviewCards[i + 1] ?? null]);
    }
    return pairs;
  }, [reviewCards]);

  const scrollMobileReviewCarousel = (direction: "prev" | "next") => {
    const el = reviewsScrollRef.current;
    if (!el) return;
    const firstSlide = el.querySelector<HTMLElement>("[data-review-slide]");
    if (!firstSlide) return;
    const gapPx = 24;
    const step = firstSlide.getBoundingClientRect().width + gapPx;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const forward = direction === "next";
    const eps = 2;
    if (!forward && el.scrollLeft <= eps) {
      el.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else if (forward && el.scrollLeft >= maxScroll - eps) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: (forward ? 1 : -1) * step, behavior: "smooth" });
    }
  };

  const navigateRecentReviews = (direction: "prev" | "next") => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches
    ) {
      setReviewPage((prev) => {
        const tp = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
        if (direction === "prev") {
          return prev === 0 ? tp - 1 : prev - 1;
        }
        return prev === tp - 1 ? 0 : prev + 1;
      });
      return;
    }
    scrollMobileReviewCarousel(direction);
  };

  const activeBestInSlug =
    rotatingCategorySlugs && rotatingCategorySlugs.length > 0
      ? rotatingCategorySlugs[bestInIndex % rotatingCategorySlugs.length]
      : "banking";

  /** Server already returns top 8 per slug; keep trust → count → name order (include 0-review rows). */
  const rankedBestInBusinesses: BestInBusiness[] = useMemo(() => {
    const list = (clientBestInByCategory ?? {})[activeBestInSlug] ?? [];
    if (!Array.isArray(list) || list.length === 0) return [];

    const withScores = list.map((biz) => {
      const reviewCount = Number(biz.review_count ?? 0) || 0;
      const rating = Number(biz.trust_score ?? 0) || 0;
      return { biz, reviewCount, rating };
    });

    withScores.sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return (a.biz.name || "").localeCompare(b.biz.name || "");
    });

    return withScores.slice(0, 8).map((item) => item.biz);
  }, [activeBestInSlug, clientBestInByCategory]);

  const activeBestInLabel =
    (bestInCategoryLabels ?? {})[activeBestInSlug] ??
    (activeBestInSlug ?? "").replace(/-/g, " ");

  // Best-in: `/api/home-best-in`. Live PostgREST + `get_public_review_aggregates` per country.
  useEffect(() => {
    if (pathname !== "/") return;
    if (!rotatingCategorySlugs || rotatingCategorySlugs.length === 0) return;

    const ac = activeCountryCode;
    const bestKey = `${pathname}:${ac}:${rotatingBestInSlugsKey}`;

    if (lastCompletedBestInKeyRef.current === bestKey) {
      return;
    }

    const initialNorm = normalizeHomeCountry(initialSelectedCountry ?? "US");
    if (
      lastCompletedBestInKeyRef.current === null &&
      ac === initialNorm &&
      rotatingCategorySlugs.every((slug) =>
        Object.prototype.hasOwnProperty.call(clientBestInByCategory, slug),
      )
    ) {
      lastCompletedBestInKeyRef.current = bestKey;
      bestInCountryPrevRef.current = ac;
      return;
    }

    const prevCountry = bestInCountryPrevRef.current;
    bestInCountryPrevRef.current = ac;
    if (prevCountry !== null && prevCountry !== ac) {
      setClientBestInByCategory({});
    }

    const fetchId = ++bestInFetchGenRef.current;
    const bestInController = new AbortController();

    const applyFullBestIn = (raw: Record<string, unknown> | undefined) => {
      const incoming = raw ?? {};
      setClientBestInByCategory(() => {
        const out: Record<string, BestInBusiness[]> = {};
        for (const slug of rotatingCategorySlugs) {
          const rows = incoming[slug];
          out[slug] = Array.isArray(rows) ? (rows as BestInBusiness[]) : [];
        }
        return out;
      });
    };

    void (async () => {
      try {
        const q = new URLSearchParams();
        q.set("country", ac);
        const res = await fetch(`/api/home-best-in?${q.toString()}`, {
          cache: "no-store",
          signal: bestInController.signal,
        });
        if (fetchId !== bestInFetchGenRef.current) return;

        if (res.ok) {
          try {
            const raw = (await res.json()) as unknown;
            if (
              raw &&
              typeof raw === "object" &&
              "byCategory" in (raw as object)
            ) {
              const pack = raw as { byCategory?: Record<string, unknown> };
              applyFullBestIn(pack.byCategory);
            } else {
              applyFullBestIn({});
            }
            lastCompletedBestInKeyRef.current = bestKey;
          } catch {
            applyFullBestIn({});
            lastCompletedBestInKeyRef.current = bestKey;
          }
        } else {
          applyFullBestIn({});
          lastCompletedBestInKeyRef.current = bestKey;
        }
      } catch {
        if (fetchId !== bestInFetchGenRef.current) return;
        if (bestInController.signal.aborted) return;
        applyFullBestIn({});
        lastCompletedBestInKeyRef.current = bestKey;
      }
    })();

    return () => {
      bestInController.abort();
    };
  }, [bestInEffectSyncKey, rotatingCategorySlugs]);

  // Recent reviews: `/api/home-feed`. Keep the "What people are saying" rail in
  // sync with the active country instantly when the user switches in the navbar
  // dropdown, without waiting for the full SSR re-render of `/`.
  useEffect(() => {
    if (pathname !== "/") return;

    const ac = activeCountryCode;
    const feedKey = `${pathname}:${ac}`;

    if (lastCompletedHomeFeedKeyRef.current === feedKey) return;

    // Skip the first fetch when SSR already returned the matching country: the
    // initial `homeFeedRawRows` are correct and re-fetching would just churn UI.
    const initialNorm = normalizeHomeCountry(initialSelectedCountry ?? "US");
    if (
      lastCompletedHomeFeedKeyRef.current === null &&
      ac === initialNorm
    ) {
      lastCompletedHomeFeedKeyRef.current = feedKey;
      return;
    }

    const fetchId = ++homeFeedFetchGenRef.current;
    const controller = new AbortController();

    void (async () => {
      try {
        const q = new URLSearchParams();
        q.set("country", ac);
        const res = await fetch(`/api/home-feed?${q.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (fetchId !== homeFeedFetchGenRef.current) return;

        if (res.ok) {
          try {
            const raw = (await res.json()) as unknown;
            const rows: Record<string, unknown>[] = Array.isArray(raw)
              ? (raw as Record<string, unknown>[])
              : Array.isArray((raw as { data?: unknown[] } | null)?.data)
                ? ((raw as { data: Record<string, unknown>[] }).data)
                : [];
            setHomeFeedRawRows(sortHomeFeedRowsByDateDesc(rows));
            setReviewPage(0);
            lastCompletedHomeFeedKeyRef.current = feedKey;
          } catch {
            // Bad JSON. Leave whatever we had instead of clearing the rail.
            lastCompletedHomeFeedKeyRef.current = feedKey;
          }
        } else {
          // Non-OK: leave the rail as-is rather than emptying it; the next
          // country switch / page reload will retry. Still mark complete so
          // we don't tight-loop on a broken endpoint.
          lastCompletedHomeFeedKeyRef.current = feedKey;
        }
      } catch {
        if (fetchId !== homeFeedFetchGenRef.current) return;
        if (controller.signal.aborted) return;
        lastCompletedHomeFeedKeyRef.current = feedKey;
      }
    })();

    return () => {
      controller.abort();
    };
  }, [pathname, activeCountryCode, initialSelectedCountry]);

  useEffect(() => {
    if (pathname !== "/" || reviews.length === 0) {
      return;
    }
    const hint = readHomeFeedHighlight();
    if (!hint) {
      return;
    }
    clearHomeFeedHighlight();
    setReviewPage(0);

    const pickId =
      hint.type === "review" && reviews.some((r) => r.review_id === hint.id)
        ? hint.id
        : reviews[0]?.review_id ?? null;

    if (pickId) {
      setHighlightedReviewId(pickId);
    }

    requestAnimationFrame(() => {
      recentReviewsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      reviewsScrollRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    });

    if (homeHighlightClearTimerRef.current != null) {
      window.clearTimeout(homeHighlightClearTimerRef.current);
    }
    homeHighlightClearTimerRef.current = window.setTimeout(() => {
      setHighlightedReviewId(null);
      homeHighlightClearTimerRef.current = null;
    }, 6000);
  }, [reviews, pathname]);

  useEffect(() => {
    return () => {
      if (homeHighlightClearTimerRef.current != null) {
        window.clearTimeout(homeHighlightClearTimerRef.current);
        homeHighlightClearTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (reviewPage >= totalReviewPages) {
      setReviewPage(0);
    }
  }, [reviewPage, totalReviewPages]);

  useEffect(() => {
    setReviewPage(0);
  }, [activeCountryCode]);

  useEffect(() => {
    reviewsScrollRef.current?.scrollTo({ left: 0 });
  }, [activeCountryCode]);

  const scrollCategories = (direction: "left" | "right") => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const amount = Math.min(320, el.clientWidth * 0.8);
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const getCategoryIcon = (name: string) => {
    const value = name.toLowerCase();
    const iconClass = "h-7 w-7 text-[#124541]";

    // Hotels / accommodation
    if (
      value.includes("hotel") ||
      value.includes("lodging") ||
      value.includes("accommodation")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18V8" />
          <path d="M3 12h18" />
          <rect x="7" y="9" width="6" height="3" rx="1" />
          <path d="M21 18V7" />
          <path d="M13 12h8" />
        </svg>
      );
    }

    // Banking / money
    if (value.includes("bank") || value.includes("money") || value.includes("finance")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 10h16" />
          <path d="M5 10V8.5L12 4l7 4.5V10" />
          <rect x="5" y="10" width="3" height="7" />
          <rect x="10.5" y="10" width="3" height="7" />
          <rect x="16" y="10" width="3" height="7" />
          <path d="M4 17h16" />
        </svg>
      );
    }

    // Travel agencies
    if (value.includes("travel")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 10l4.5 1.5L12 9l-1.5 4.5L15 18l1.5-4.5L20 12" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    }

    // Cars & trucks
    if (value.includes("car") || value.includes("truck")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="5" rx="1" />
          <path d="M7 11l1.5-3h7L17 11" />
          <circle cx="7" cy="17" r="1.4" />
          <circle cx="17" cy="17" r="1.4" />
        </svg>
      );
    }

    // Furniture stores
    if (value.includes("furniture")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="9" width="16" height="6" rx="1.5" />
          <path d="M8 9V6h8v3" />
          <path d="M7 15v3" />
          <path d="M17 15v3" />
        </svg>
      );
    }

    // Jewelry & watches
    if (value.includes("jewel") || value.includes("watch")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 8v2.5l1.8 1.2" />
          <rect x="10" y="3" width="4" height="3" rx="1" />
          <rect x="10" y="18" width="4" height="3" rx="1" />
        </svg>
      );
    }

    // Clothing & underwear
    if (value.includes("clothing") || value.includes("underwear") || value.includes("clothes")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 4l4 2 4-2 2 3-3 2v9H9V9L6 7z" />
        </svg>
      );
    }

    // Appliances & electronics
    if (value.includes("appliance") || value.includes("electronic")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="4" width="14" height="14" rx="2" />
          <rect x="8" y="7" width="8" height="6" rx="1" />
          <path d="M9 17h6" />
          <path d="M9 14.5h.01" />
          <path d="M15 14.5h.01" />
        </svg>
      );
    }

    // Fitness & gyms
    if (value.includes("fitness") || value.includes("gym")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 7v10" />
          <path d="M18 7v10" />
          <rect x="8" y="8" width="2" height="8" />
          <rect x="14" y="8" width="2" height="8" />
          <path d="M4 9v6" />
          <path d="M20 9v6" />
        </svg>
      );
    }

    // Pet store (paw)
    if (value.includes("pet")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 10c1.5 0 2.5-1.5 2.5-3S13.5 4 12 4s-2.5 1.5-2.5 3 1 3 2.5 3z" />
          <path d="M12 10v11" />
          <path d="M8 14c0 2 1.5 3 4 3s4-1 4-3" />
          <circle cx="9" cy="8" r="1.2" fill="currentColor" />
          <circle cx="15" cy="8" r="1.2" fill="currentColor" />
        </svg>
      );
    }

    // Energy / utilities (lightning)
    if (value.includes("energy") || value.includes("supplier")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L4 14h6l-3 8 9-12h-6l3-8z" />
        </svg>
      );
    }

    // Real estate / mortgage (house)
    if (value.includes("real estate") || value.includes("mortgage")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12l9-9 9 9" />
          <path d="M5 10v10h4v-5h6v5h4V10" />
        </svg>
      );
    }

    // Insurance (umbrella)
    if (value.includes("insurance")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v12" />
          <path d="M4 12c0-4 3.6-8 8-8s8 4 8 8" />
          <path d="M4 12h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z" />
        </svg>
      );
    }

    // Bedroom / bed
    if (value.includes("bedroom") || value.includes("bed ")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12v7h4v-5h10v5h4v-7" />
          <path d="M3 12h18" />
          <path d="M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4" />
        </svg>
      );
    }

    // Activewear / women's / men's clothing (dress or shirt)
    if (value.includes("activewear") || value.includes("women's")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4l4 2-2 4v8H10v-8l-2-4 4-2V2z" />
          <path d="M8 22h8" />
        </svg>
      );
    }
    if (value.includes("men's")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4l2 4 4 2-2 4v6H8v-6l-2-4 4-2 2-4z" />
          <path d="M12 4l-2 4-4 2 2 4h8l2-4-4-2-2-4z" />
        </svg>
      );
    }

    // Shopping / retail (bag)
    if (value.includes("shopping")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8v12h12V8" />
          <path d="M6 8h12" />
          <path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      );
    }

    // Bicycle
    if (value.includes("bicycle")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="16" r="3" />
          <circle cx="18" cy="16" r="3" />
          <path d="M6 16l3-6 3 2 3-4 3 2" />
          <path d="M12 12v4" />
        </svg>
      );
    }

    // Shoe store
    if (value.includes("shoe")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14h16l1-4H3l1 4z" />
          <path d="M4 14v4h16v-4" />
          <path d="M5 18v2h4v-2M15 18v2h4v-2" />
        </svg>
      );
    }

    // Cosmetics (bottle)
    if (value.includes("cosmetic")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 4h8v14a2 2 0 01-2 2h-4a2 2 0 01-2-2V4z" />
          <path d="M10 2h4v2h-4z" />
          <path d="M12 8v4" />
        </svg>
      );
    }

    // Garden center (wheelbarrow / plant)
    if (value.includes("garden")) {
      return (
        <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 16h14" />
          <path d="M5 16V9l3-4 8 2-3 9H5z" />
          <circle cx="7" cy="19" r="1.5" />
          <circle cx="17" cy="19" r="1.5" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        className={iconClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 12h8" />
        <path d="M12 9v6" />
      </svg>
    );
  };

  const faqJsonLd = buildFaqJsonLd();

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* HERO */}
      <section
        className="relative overflow-hidden bg-[#0E0E0E] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/brand/Hero%20section-%20Binoculus(1)(1).png')",
        }}
        onPointerDown={() => heroStarFieldRef.current?.triggerShot()}
      >
        <HeroStarField ref={heroStarFieldRef} />
        <div className="relative z-10 mx-auto flex min-h-[440px] max-w-7xl flex-col items-center px-6 pb-14 pt-20 text-center sm:min-h-[520px] sm:pt-24 md:pt-32 md:pb-16">
          <div className="w-full max-w-md sm:max-w-lg md:max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            <span className="bg-gradient-to-r from-[#9CA3AF] via-[#D1D5DB] to-[#F3F4F6] bg-clip-text text-transparent">
              Customer{" "}
            </span>
            <span className="text-[#EDE6DC]">Reviews &amp; Feedback</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-5 text-sm font-normal tracking-wide text-[#F9FAFB]/90 sm:mt-6 sm:text-base"
          >
            {isGlobalHome
              ? "Discover honest experiences. Read and write real customer reviews. Gain trusted insights for businesses around the world on Tellacity."
              : `Discover honest experiences. Read and write real customer reviews. Gain trusted insights for ${activeCountry.name} businesses on Tellacity.`}
          </motion.p>
          <FadeUp delay={0.2}>
            <div className="mt-5 w-full sm:mt-6 max-w-3xl mx-auto">
              <BusinessSearchInput
                placeholder="Find businesses you can trust..."
                heroLayout
                heroButtonLabel="FIND A BUSINESS"
                onSelect={(business) => {
                  router.push(`/b/${business.slug}`);
                }}
                onSubmitQuery={(query) => {
                  if (!query.trim()) return;
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
              />
            </div>
          </FadeUp>
          <div className="mt-5 sm:mt-6">
            <Link
              href="/write-review"
              className="relative inline-flex items-center gap-1.5 rounded-full bg-[#124541] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_0_rgba(18,69,65,0)] transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-xs hover:shadow-[0_0_14px_rgba(18,69,65,0.85),0_0_26px_rgba(18,69,65,0.5)] active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11.48 3.5a.6.6 0 011.04 0l2.11 4.27a.6.6 0 00.45.33l4.71.69a.6.6 0 01.33 1.02l-3.41 3.32a.6.6 0 00-.17.53l.8 4.69a.6.6 0 01-.87.63l-4.22-2.22a.6.6 0 00-.56 0l-4.22 2.22a.6.6 0 01-.87-.63l.8-4.69a.6.6 0 00-.17-.53L3.88 10.1a.6.6 0 01.33-1.02l4.71-.69a.6.6 0 00.45-.33l2.11-4.27z" />
              </svg>
              Write a Review
            </Link>
          </div>
          </div>
        </div>
      </section>

      <RotatingBestCategorySection
        categorySlug={activeBestInSlug}
        categoryLabel={activeBestInLabel}
        businesses={rankedBestInBusinesses}
        countryCode={activeCountryCode}
        isLoading={
          rotatingCategorySlugs.length > 0 &&
          !Object.prototype.hasOwnProperty.call(
            clientBestInByCategory ?? {},
            activeBestInSlug,
          )
        }
        onPrevious={() =>
          setBestInIndex((prev) =>
            rotatingCategorySlugs?.length
              ? (prev - 1 + rotatingCategorySlugs.length) %
                rotatingCategorySlugs.length
              : 0
          )
        }
        onNext={() =>
          setBestInIndex((prev) =>
            rotatingCategorySlugs?.length
              ? (prev + 1) % rotatingCategorySlugs.length
              : 0
          )
        }
      />

      {/* Find businesses by category – 24 items, right-to-left marquee + arrow buttons */}
      <section className="bg-white overflow-visible">
        <div className="mx-auto w-full max-w-7xl overflow-visible px-6 py-8 sm:py-10 md:py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
                <span className="relative inline-block">
                  <span className="relative inline-block">
                    <span className="relative z-10">Find</span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                  {" "}businesses by category
                </span>
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-600">
                Browse {activeCountry.name} businesses by category. Tap to explore or use More for
                all.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                aria-label="Scroll categories left"
                className={CAROUSEL_NAV_BUTTON_CLASS}
              >
                <CarouselNavChevron dir="left" />
              </button>
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                aria-label="Scroll categories right"
                className={CAROUSEL_NAV_BUTTON_CLASS}
              >
                <CarouselNavChevron dir="right" />
              </button>
              <Link
                href="/categories"
                className="rounded-full border border-[#1FAF9E] px-2.5 py-1 text-[10px] font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                More
              </Link>
            </div>
          </div>
          <div
            ref={categoryScrollRef}
            className="relative mt-6 overflow-x-auto overflow-y-visible pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* Soft live pulse behind the row (no layout shift) */}
            <div
              className="pointer-events-none absolute inset-x-0 top-1/2 h-24 -translate-y-1/2 rounded-[2rem] bg-gradient-to-r from-[#1FAF9E]/[0.07] via-[#2fb2a8]/[0.12] to-[#1FAF9E]/[0.07] opacity-80 blur-2xl animate-category-strip-glow"
              aria-hidden
            />
            <div className="relative flex w-max flex-nowrap gap-3 py-2 sm:gap-4 md:gap-5">
              {marqueeItems.map((category) =>
                isSafeCategorySlug((category.slug ?? "").trim()) ? (
                  <Link
                    key={category.id}
                    href={categoryBrowseHref(category.slug)}
                    className={cn(
                      "group relative flex min-w-[5.25rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-3 py-3 text-center sm:min-w-[5.75rem] sm:px-3.5 sm:py-3.5",
                      "touch-manipulation",
                      "border border-transparent bg-white/40 backdrop-blur-[2px]",
                      "transition-all duration-300 ease-out",
                      "hover:-translate-y-1.5 hover:scale-[1.07] hover:border-[#1FAF9E]/25",
                      "hover:bg-gradient-to-b hover:from-white hover:to-emerald-50/95",
                      "hover:shadow-[0_14px_36px_-8px_rgba(31,175,158,0.55),0_0_0_1px_rgba(31,175,158,0.12)]",
                      "hover:ring-2 hover:ring-[#1FAF9E]/30",
                      "active:scale-[0.98] active:translate-y-0",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E] focus-visible:ring-offset-2",
                    )}
                  >
                    <span
                      className="pointer-events-none absolute -inset-1 rounded-2xl bg-[#1FAF9E]/0 opacity-0 blur-md transition-all duration-300 group-hover:bg-[#1FAF9E]/20 group-hover:opacity-100"
                      aria-hidden
                    />
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#124541]/80 transition-all duration-300 group-hover:scale-110 group-hover:text-[#1FAF9E] group-hover:drop-shadow-[0_0_10px_rgba(31,175,158,0.45)] sm:h-12 sm:w-12">
                      {getCategoryIcon(category.name)}
                    </span>
                    <span className="relative max-w-[7.5rem] whitespace-normal text-[11px] font-medium leading-snug text-[#0E0E0E]/90 transition-colors duration-300 group-hover:font-semibold group-hover:text-[#124541] sm:max-w-[8.5rem] sm:text-xs">
                      {category.name}
                    </span>
                  </Link>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RECENT REVIEWS */}
      <section
        ref={recentReviewsSectionRef}
        className="mx-auto max-w-7xl px-6 py-8 sm:py-10 md:py-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              <span className="inline-flex items-center gap-2">
                <span className="relative inline-block">
                  <span className="relative inline-block">
                    <span className="relative z-10">Recent</span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                  {isGlobalHome
                    ? " customer reviews from around the world"
                    : ` customer reviews in ${activeCountry.name}`}
                </span>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    className="inline-flex min-h-9 min-w-[3.25rem] items-center justify-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 shadow-sm hover:border-gray-400 sm:min-h-10 sm:min-w-[3.5rem] sm:px-3 sm:py-2"
                    onClick={() => setIsCountryMenuOpen((prev) => !prev)}
                    aria-label={`Change country for recent reviews, categories, and rankings (currently ${activeCountry.name})`}
                    aria-expanded={isCountryMenuOpen}
                    aria-haspopup="listbox"
                  >
                    <img
                      src={activeCountry.flagUrl}
                      alt=""
                      className="h-4 w-6 shrink-0 rounded-sm object-cover ring-1 ring-black/10 sm:h-[18px] sm:w-[27px]"
                      aria-hidden="true"
                    />
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 shrink-0 text-[#0E0E0E] sm:h-[18px] sm:w-[18px]"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isCountryMenuOpen && (
                    <div
                      className="absolute right-0 z-10 mt-1.5 max-h-64 w-auto overflow-y-auto rounded-md border border-gray-300 bg-white py-1 shadow-lg"
                      role="listbox"
                      aria-label="Select country"
                    >
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          role="option"
                          aria-selected={country.code === activeCountryCode}
                          className="flex w-full min-h-10 items-center justify-center px-3 py-2 hover:bg-gray-50 aria-selected:bg-[#E5F4F2]"
                          onClick={() =>
                            handleCountryChange(country.code as CountryCode)
                          }
                        >
                          <img
                            src={country.flagUrl}
                            alt=""
                            className="h-4 w-6 shrink-0 rounded-sm object-cover ring-1 ring-black/10"
                            aria-hidden="true"
                          />
                          <span className="sr-only">{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {isGlobalHome
                ? `Real customer reviews from businesses around the world, moderated for authenticity, newest first. Showing reviews from ${activeCountry.name} by default, switch country to update categories and rankings.`
                : `Real customer reviews in ${activeCountry.name}, moderated for authenticity, newest first. The same country applies to categories and rankings on this page.`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={CAROUSEL_NAV_BUTTON_CLASS}
              aria-label="Previous reviews"
              onClick={() => navigateRecentReviews("prev")}
            >
              <CarouselNavChevron dir="left" />
            </button>
            <button
              type="button"
              className={CAROUSEL_NAV_BUTTON_CLASS}
              aria-label="Next reviews"
              onClick={() => navigateRecentReviews("next")}
            >
              <CarouselNavChevron dir="right" />
            </button>
          </div>
        </div>

        {/* Mobile: one card on top, one on bottom per slide; ~half of next column peeks to encourage swipe */}
        <div
          ref={reviewsScrollRef}
          className="mt-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 pr-6 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {isLoading &&
            [1, 2].map((i) => (
              <div
                key={i}
                data-review-slide
                className="flex w-[calc((100vw-3rem)*0.67)] min-w-[260px] shrink-0 snap-center flex-col gap-4"
              >
                <div className="h-48 shrink-0 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
                <div className="h-48 shrink-0 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
              </div>
            ))}
          {!isLoading &&
            allReviewPairCards.length > 0 &&
            allReviewPairCards.map((pair, idx) => (
              <div
                key={`slide-${idx}`}
                data-review-slide
                className="flex w-[calc((100vw-3rem)*0.67)] min-w-[260px] shrink-0 snap-center flex-col gap-4"
              >
                {pair[0]}
                {pair[1]}
              </div>
            ))}
        </div>

        {/* Tablet: 2 cols; desktop: 4 cards per row */}
        <div className="mt-6 hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-[328px] rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          {!isLoading &&
            visibleReviewCards.length > 0 &&
            visibleReviewCards}
        </div>

        {!isLoading && visibleReviews.length === 0 && !error && (
          <p className="mt-8 text-center text-sm text-gray-500 py-8">
            No reviews to show yet. Check back soon.
          </p>
        )}
      </section>

      {/* FAQ SECTION */}
      <section className="bg-white" aria-label="FAQ list">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10 md:py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
              Everything you need to know about Tellacity. Whether you&apos;re a
              consumer looking to share an experience or a business building
              trust, we&apos;re here to help.
            </p>
          </div>

          <FaqAccordionList className="mt-8" />
        </div>
      </section>

      {/* LATEST BLOG POSTS */}
      <motion.section
        className="bg-white"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 md:py-12">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              <span className="relative inline-block">
                <span className="relative inline-block">
                  <span className="relative z-10">Latest</span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
                {" "}blog posts about trust and reviews
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Insights, guides, and stories on verified reviews, reputation,
              and growing your business with customer trust.
            </p>
            <Link
              href="/blog"
              className="mt-3 inline-block text-sm font-semibold text-[#2fb2a8] hover:underline"
            >
              View All Blog Posts
            </Link>
          </div>

          <div className="mt-6">
            {latestBlogPost && (
              <div
                key={latestBlogPost.title}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:flex"
              >
                <motion.div
                  className="flex-1 p-8"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={{
                    hidden: {},
                    show: {
                      transition: {
                        staggerChildren: 0.12,
                      },
                    },
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <span className="inline-flex rounded-full bg-[#E6F6F1] px-3 py-1 text-xs font-semibold text-[#0B3B36]">
                      {latestBlogPost.category}
                    </span>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <h3 className="mt-4 text-base font-semibold text-[#0E0E0E] sm:text-lg md:text-xl">
                      {latestBlogPost.title}
                    </h3>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <p className="mt-3 text-sm text-gray-600">
                      {latestBlogPost.description}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <Link
                      href={latestBlogPost.href}
                      className="mt-6 inline-flex items-center rounded-lg bg-[#0B3B36] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Read More
                    </Link>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="h-64 w-full bg-gray-100 lg:h-auto lg:w-[46%]"
                  initial={{ opacity: 0, scale: 1.05 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9 }}
                  viewport={{ once: true }}
                >
                  <img
                    src={latestBlogPost.imageSrc}
                    alt={latestBlogPost.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* BUSINESS CTA */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 md:py-12">
          <div className="rounded-[28px] bg-[#D9FAEF] px-8 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      For businesses: Build trust with customer reviews
                    </span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h2>
                <p className="mt-3 text-sm text-[#0E0E0E]/80">
                  Grow your business with verified customer reviews on
                  Tellacity. Collect authentic feedback, strengthen your
                  online reputation, and build trust with new customers by
                  showcasing real experiences. Part of the{" "}
                  <Link
                    href="/reputation-platform"
                    className="font-semibold text-[#0F766E] hover:underline"
                  >
                    Tellacity Reputation Platform
                  </Link>{" "}
                  for verified customer reviews and trust signals across every
                  surface.
                </p>
              </div>
              <Link
                href="/for-business"
                className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 active:scale-95"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT TELLACITY */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-4xl px-6 pb-10 sm:pb-12 md:pb-14">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              <span className="relative inline-block">
                <span className="relative z-10">About</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>{" "}
              Tellacity
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-700">
              {isGlobalHome
                ? "Tellacity is a platform for verified customer reviews that connects consumers with trustworthy businesses worldwide. Businesses use Tellacity to collect verified reviews, protect against fake feedback, and build long-term trust with tools like Review Invitations, Review Widgets, Business Analytics, Reputation Management, and Photo Uploads."
                : `Tellacity is a platform for verified customer reviews that connects consumers with trustworthy ${activeCountry.name} businesses. Businesses use Tellacity to collect verified reviews, protect against fake feedback, and build long-term trust with tools like Review Invitations, Review Widgets, Business Analytics, Reputation Management, and Photo Uploads.`}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              Part of the{" "}
              <Link
                href="/reputation-platform"
                className="font-semibold text-[#0F766E] hover:underline"
              >
                Tellacity Reputation Platform
              </Link>{" "}
              for verified customer reviews and trust.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

