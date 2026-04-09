"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import RecentReviewCard from "@/components/reviews/RecentReviewCard";
import RotatingBestCategorySection from "@/components/home/RotatingBestCategorySection";
import HeroStarField, {
  type HeroStarFieldHandle,
} from "@/components/home/HeroStarField";
import BusinessSearchInput from "@/components/search/BusinessSearchInput";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/MotionWrapper";
import {
  DEFAULT_COUNTRY,
  getStoredCountry,
  setStoredCountry,
} from "@/lib/country";
import { similarBusinessLogoUrl } from "@/lib/logo";
import { getAllBlogPosts } from "../data/blogPosts";
import {
  clearHomeFeedHighlight,
  readHomeFeedHighlight,
} from "@/lib/homeFeedHighlight";
import { normalizeBusinessIdKey } from "@/lib/normalizeBusinessId";
import { cn } from "@/lib/utils";
import {
  HOME_MARQUEE_CATEGORY_ITEMS,
  LOOKING_FOR_CATEGORIES,
  buildMarqueeCategoryCards,
  type HomeMarqueeCategoryCard,
} from "@/lib/homeMarqueeCategories";

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

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
};

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

const normalizeCountryCode = (code: string | null | undefined): CountryCode => {
  const upper = (code ?? "US").toUpperCase();
  if (upper === "UK") return "GB";
  const found = COUNTRIES.find((country) => country.code === upper);
  return (found?.code ?? "US") as CountryCode;
};

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

/** Map RPC row from get_top_businesses_for_category_global to card props (logo + scores). */
function mapRpcRowToBestIn(row: Record<string, unknown>): BestInBusiness {
  const logo =
    (typeof row.logo_url === "string" && row.logo_url.trim() !== "" && row.logo_url) ||
    (typeof row.resolved_logo_url === "string" &&
      row.resolved_logo_url.trim() !== "" &&
      row.resolved_logo_url) ||
    null;
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    website: typeof row.website === "string" ? row.website : null,
    website_display:
      typeof row.website_display === "string" ? row.website_display : null,
    trust_score: row.trust_score != null ? Number(row.trust_score) : 0,
    review_count: row.review_count != null ? Number(row.review_count) : 0,
    logo_url: logo,
    resolved_logo_url: logo,
  };
}

export type BestInBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  website_display?: string | null;
  logo_url?: string | null;
  resolved_logo_url?: string | null;
  trust_score?: number | null;
  review_count?: number | null;
};

type HomePageClientProps = {
  initialSelectedCountry: string | null;
  rotatingCategorySlugs: string[];
  bestInByCategory: Record<string, BestInBusiness[]>;
  bestInCategoryLabels: Record<string, string>;
  rpcDebug?: Record<
    string,
    { country: string; error: string | null; count: number }
  >;
  /** Server-validated marquee tiles; falls back to static list if empty. */
  marqueeCategories?: HomeMarqueeCategoryCard[];
};

export default function HomePageClient({
  initialSelectedCountry = null,
  rotatingCategorySlugs = [],
  bestInByCategory = {},
  bestInCategoryLabels = {},
  rpcDebug = {},
  marqueeCategories: marqueeCategoriesProp,
}: HomePageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [homeFeedRawRows, setHomeFeedRawRows] = useState<
    Record<string, unknown>[]
  >([]);
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<CategoryCard[]>(() =>
    LOOKING_FOR_CATEGORIES.map(({ label, slug }) => ({
      id: `static-${slug}`,
      name: label,
      slug,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [highlightedReviewId, setHighlightedReviewId] = useState<
    string | null
  >(null);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    initialSelectedCountry ?? null
  );
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const reviewsScrollRef = useRef<HTMLDivElement | null>(null);
  const recentReviewsSectionRef = useRef<HTMLElement | null>(null);
  const homeHighlightClearTimerRef = useRef<number | null>(null);
  const heroStarFieldRef = useRef<HeroStarFieldHandle | null>(null);
  const [bestInIndex, setBestInIndex] = useState(0);
  const [bestInMetrics, setBestInMetrics] = useState<
    Record<string, { review_count: number; trust_score: number }>
  >({});
  const [clientBestInByCategory, setClientBestInByCategory] =
    useState<Record<string, BestInBusiness[]>>(bestInByCategory ?? {});

  /** URL wins so `?country=ZA` matches Best-in RPC and home-feed (same as server `p_country_code`). */
  const activeCountryCode = normalizeCountryCode(
    searchParams.get("country") ?? selectedCountry ?? initialSelectedCountry
  );
  const activeCountry =
    COUNTRIES.find((country) => country.code === activeCountryCode) ??
    COUNTRIES[0];

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
    setSelectedCountry(code);
    setStoredCountry(code);
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsCountryMenuOpen(false);
  };

  const faqItems = [
    {
      question: "What is Tellacity?",
      answer:
        "Tellacity is a global customer reviews and feedback platform where people share real experiences about businesses. Reviews are protected by verification and fraud-prevention systems to ensure they are genuine. Businesses use Tellacity to collect authentic customer reviews, build trust, strengthen their reputation, and gain insights to improve their services and grow.",
    },
    {
      question: "How does Tellacity ensure reviews are trustworthy?",
      answer:
        "Tellacity uses several layers of verification to maintain trust. Reviewers may provide proof of purchase such as receipts, invoices, or order confirmations. Our systems also detect suspicious activity like duplicate accounts, spam, or unusual review patterns. Businesses and users can flag reviews that violate our guidelines, and our moderation team reviews them through a transparent dispute process.",
    },
    {
      question: "Can businesses respond to reviews?",
      answer:
        "Yes. Businesses can publicly reply to customer reviews-both positive and negative. This encourages open communication and allows businesses to resolve issues directly with customers. When a business responds, the reply is marked with an “Owner Responded” badge so readers can clearly see the conversation.",
    },
    {
      question: "What is a ‘Verified Review’?",
      answer:
        "A Verified Review is marked with a badge showing the reviewer provided proof of their transaction, such as a receipt, booking number, or payment confirmation. Verified Reviews carry greater credibility and may receive higher visibility because they confirm the reviewer had a real experience with the business.",
    },
    {
      question: "How can I claim my business on Tellacity?",
      answer:
        "Claiming your business is simple. Search for your business on Tellacity and click “Claim Business.” You’ll be asked to verify ownership through methods such as email verification, domain verification, or official documentation. Once approved, you can manage reviews, access analytics, and use Tellacity tools to grow your reputation.",
    },
    {
      question: "Is Tellacity free to use?",
      answer:
        "Yes. Consumers can read, write, and share reviews for free. Businesses can also claim their profile and respond to reviews using our Free Plan. Paid plans such as Grow, Premium, and Elite unlock additional features like advanced analytics, integrations, and automated review collection tools.",
    },
    {
      question: "How do I report a fake or inappropriate review?",
      answer:
        "If you believe a review violates our Community Guidelines, click the “Report Review” option below the review. Select the reason (such as spam, offensive content, or conflict of interest), and our moderation team will investigate. During this process, the review may be temporarily marked as “Under Review.”",
    },
    {
      question: "Do I need an account to write a review?",
      answer:
        "Yes. Creating a free Tellacity account helps prevent spam, links reviews to real users, and allows you to manage or update your reviews later.",
    },
    {
      question: "Can I edit or delete my review?",
      answer:
        "Yes. You can edit your review shortly after posting to correct mistakes or add details. You can also delete your review at any time from your user dashboard.",
    },
    {
      question: "Will the business see my contact details?",
      answer:
        "No. Your email address and phone number remain private. Businesses only see your public profile name and the content of your review. If a dispute arises, you may choose to share additional details privately.",
    },
    {
      question: "What benefits do businesses get by claiming their profile?",
      answer:
        "Claiming your profile gives businesses access to tools that help manage and grow their reputation. These include responding to reviews, tracking ratings and customer sentiment, improving search visibility, integrating with platforms like Shopify or Paystack, and displaying verified trust badges on their website.",
    },
    {
      question: "What payment methods does Tellacity support?",
      answer:
        "Tellacity supports major credit cards and several local payment methods through our payment partners, including Paystack, PayFast, and PayPal, making subscription management easy for businesses worldwide.",
    },
    {
      question: "Can multiple team members manage one business account?",
      answer:
        "Yes. Businesses can invite team members and assign roles such as Admin or Manager. This allows customer support, marketing, or operations teams to manage reviews and analytics without sharing a single login.",
    },
    {
      question: "How are disputes handled?",
      answer:
        "When a business disputes a review, the review enters a mediation process. The reviewer may be asked to provide proof of experience or clarification. Our moderation team evaluates the evidence fairly. If the review violates our guidelines, it is removed; otherwise, it remains visible.",
    },
    {
      question: "What happens if a business tries to delete negative reviews?",
      answer:
        "Businesses cannot delete legitimate customer reviews. Transparency is a core principle of Tellacity. Reviews remain visible unless they violate our content policies, such as containing spam, hate speech, or fraudulent content.",
    },
    {
      question: "How does Tellacity protect against manipulation?",
      answer:
        "Tellacity actively monitors for review manipulation, including bulk fake reviews, paid review schemes, or coordinated attacks. Our systems analyze patterns such as IP activity, account behavior, and review timing. Violations can lead to content removal, account suspension, or warnings placed on a business profile.",
    },
  ];
  const faqMidpoint = Math.ceil(faqItems.length / 2);
  const faqColumns = [faqItems.slice(0, faqMidpoint), faqItems.slice(faqMidpoint)];
  const reviewsPerPage = 8;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const visibleReviews = reviews.slice(
    reviewPage * reviewsPerPage,
    reviewPage * reviewsPerPage + reviewsPerPage
  );
  // Mobile: one horizontal strip of all reviews (pairs of 2 cards) for swipe + prev/next
  const allReviewPairs = useMemo(() => {
    const pairs: HomeReview[][] = [];
    for (let i = 0; i < reviews.length; i += 2) {
      pairs.push(reviews.slice(i, i + 2));
    }
    return pairs;
  }, [reviews]);

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

  // Always rank "Best in" businesses by latest metrics so higher-rated
  // businesses automatically surface into the top positions.
  const rankedBestInBusinesses: BestInBusiness[] = useMemo(() => {
    const list = (clientBestInByCategory ?? {})[activeBestInSlug] ?? [];
    if (!Array.isArray(list) || list.length === 0) return [];

    const withScores = list.map((biz) => {
      const idKey = normalizeBusinessIdKey(biz.id);
      const metrics = bestInMetrics[idKey];
      const reviewCount = metrics
        ? Number(metrics.review_count ?? 0) || 0
        : Number(biz.review_count ?? 0) || 0;
      const rating = metrics
        ? Number(metrics.trust_score ?? 0) || 0
        : typeof biz.trust_score === "number"
          ? biz.trust_score || 0
          : 0;
      return { biz, reviewCount, rating };
    });

    withScores.sort((a, b) => {
      const aZero = a.reviewCount === 0 ? 1 : 0;
      const bZero = b.reviewCount === 0 ? 1 : 0;
      if (aZero !== bZero) return aZero - bZero;
      if (b.rating !== a.rating) return b.rating - a.rating;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return (a.biz.name || "").localeCompare(b.biz.name || "");
    });

    // Keep a maximum of 8 cards even if the backend returns more.
    return withScores.slice(0, 8).map((item) => item.biz);
  }, [activeBestInSlug, clientBestInByCategory, bestInMetrics]);

  const activeBestInLabel =
    (bestInCategoryLabels ?? {})[activeBestInSlug] ??
    (activeBestInSlug ?? "").replace(/-/g, " ");

  useEffect(() => {
    const fromUrl = searchParams.get("country");
    if (fromUrl) {
      const normalized = normalizeCountryCode(fromUrl);
      setSelectedCountry(normalized);
      setStoredCountry(normalized);
    } else {
      const stored = getStoredCountry();
      if (stored) setSelectedCountry(normalizeCountryCode(stored));
    }
  }, [searchParams]);

  // First visit: if URL and storage are both empty, set default once.
  useEffect(() => {
    if (pathname !== "/") return;
    const fromUrl = searchParams.get("country");
    const stored = getStoredCountry();
    if (!fromUrl && !stored) {
      setStoredCountry(DEFAULT_COUNTRY);
      const params = new URLSearchParams(searchParams.toString());
      params.set("country", DEFAULT_COUNTRY);
      router.replace(`/?${params.toString()}`, { scroll: false });
      return;
    }
    if (fromUrl) return;
    if (stored) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("country", normalizeCountryCode(stored));
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [pathname, searchParams, router]);

  // Recent reviews: always hit `/api/home-feed` with `cache: "no-store"` (avoids client Supabase / stale state after navigation).
  const homeSearchKey = searchParams.toString();
  useEffect(() => {
    if (pathname !== "/") return;

    let isMounted = true;
    let fetchGeneration = 0;
    const refreshBust =
      searchParams.get("refresh") === "true" ||
      searchParams.get("refresh") === "1";

    const fetchHomeFeed = async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      const myGen = ++fetchGeneration;

      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const q = new URLSearchParams();
        q.set("country", activeCountryCode);
        if (refreshBust) {
          q.set("_", String(Date.now()));
        }
        const res = await fetch(`/api/home-feed?${q.toString()}`, {
          cache: "no-store",
        });
        const raw: unknown = await res.json();

        if (!isMounted || myGen !== fetchGeneration) return;

        let rows: Record<string, unknown>[] = [];
        if (Array.isArray(raw)) {
          rows = raw as Record<string, unknown>[];
        } else if (
          raw &&
          typeof raw === "object" &&
          Array.isArray((raw as { data?: unknown }).data)
        ) {
          rows = (raw as { data: Record<string, unknown>[] }).data;
        }

        if (!res.ok) {
          const msg =
            raw &&
            typeof raw === "object" &&
            typeof (raw as { error?: string }).error === "string"
              ? (raw as { error: string }).error
              : "Failed to load reviews.";
          setError(msg);
          setHomeFeedRawRows([]);
          return;
        }

        setHomeFeedRawRows(sortHomeFeedRowsByDateDesc(rows));

        if (refreshBust && isMounted && myGen === fetchGeneration) {
          const p = new URLSearchParams(searchParams.toString());
          p.delete("refresh");
          const qs = p.toString();
          router.replace(qs ? `/?${qs}` : "/", { scroll: false });
        }
      } catch (e) {
        if (!isMounted || myGen !== fetchGeneration) return;
        setError(e instanceof Error ? e.message : "Failed to load reviews.");
        setHomeFeedRawRows([]);
      } finally {
        if (isMounted && myGen === fetchGeneration) {
          setIsLoading(false);
        }
      }
    };

    void fetchHomeFeed();

    const onVisible = () => {
      if (document.visibilityState !== "visible" || !isMounted) return;
      void fetchHomeFeed({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);

    const onPageShow = (ev: PageTransitionEvent) => {
      if (!isMounted) return;
      if (ev.persisted) void fetchHomeFeed({ silent: true });
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [pathname, homeSearchKey, router, activeCountryCode]);

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

  // Keep a local copy of Best-in data and fill gaps with a direct businesses fallback
  // when the RPC returns no rows for a given category/country.
  useEffect(() => {
    setClientBestInByCategory(bestInByCategory);

    const fetchFallbackForEmptyCategories = async () => {
      const country = activeCountryCode;
      const emptySlugs = Object.entries(bestInByCategory ?? {})
        .filter(
          ([, list]) => !Array.isArray(list) || (list as BestInBusiness[]).length === 0,
        )
        .map(([slug]) => slug);

      if (emptySlugs.length === 0) {
        return;
      }

      const supabase = supabaseBrowser();

      await Promise.all(
        emptySlugs.map(async (slug) => {
          const { data, error } = await supabase
            .from("businesses")
            .select(
              "id, name, slug, website, website_display, logo_url, resolved_logo_url, trust_score, review_count, country_code, category_slug, status",
            )
            .eq("status", "active")
            .eq("category_slug", slug)
            .eq("country_code", country)
            .order("trust_score", { ascending: false })
            .order("review_count", { ascending: false })
            .limit(8);

          if (!error && data && data.length > 0) {
            setClientBestInByCategory((prev) => ({
              ...prev,
              [slug]: data as BestInBusiness[],
            }));
          }
        }),
      );
    };

    fetchFallbackForEmptyCategories();
  }, [bestInByCategory, activeCountryCode]);

  // Re-fetch "Best in" per country + overlay live aggregates (matches Recent reviews / home_feed metrics).
  useEffect(() => {
    if (pathname !== "/") return;
    if (!rotatingCategorySlugs || rotatingCategorySlugs.length === 0) return;

    let cancelled = false;

    const refresh = async () => {
      const supabase = supabaseBrowser();
      const next: Record<string, BestInBusiness[]> = {};

      await Promise.all(
        rotatingCategorySlugs.map(async (slug) => {
          const { data, error } = await supabase.rpc(
            "get_top_businesses_for_category_global",
            {
              p_category_slug: slug,
              p_country_code: activeCountryCode,
              p_min_rating: null,
              p_limit: 24,
              p_offset: 0,
            }
          );
          if (cancelled) return;
          if (error) {
            console.warn("Best-in RPC:", slug, error.message);
            next[slug] = [];
            return;
          }
          const rows = Array.isArray(data) ? data : [];
          next[slug] = rows.map((row) =>
            mapRpcRowToBestIn(row as Record<string, unknown>)
          );
        })
      );

      if (cancelled) return;
      setClientBestInByCategory(next);

      const allIds = [
        ...new Set(
          Object.values(next)
            .flat()
            .map((b) => b.id)
            .filter(Boolean)
        ),
      ];
      if (allIds.length === 0) {
        setBestInMetrics({});
        return;
      }

      try {
        const res = await fetch("/api/home-best-in-metrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: allIds }),
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const map = (await res.json()) as unknown;
        if (
          cancelled ||
          !map ||
          typeof map !== "object" ||
          ("error" in (map as object) &&
            typeof (map as { error?: string }).error === "string")
        ) {
          return;
        }
        const apiMap = map as Record<
          string,
          { review_count: number; trust_score: number }
        >;
        const merged: Record<
          string,
          { review_count: number; trust_score: number }
        > = { ...apiMap };
        for (const biz of Object.values(next).flat()) {
          const k = normalizeBusinessIdKey(biz.id);
          const rcRpc = Number(biz.review_count ?? 0) || 0;
          const tsRpc = Number(biz.trust_score ?? 0) || 0;
          const cur = merged[k];
          const rcApi = cur ? Number(cur.review_count ?? 0) || 0 : 0;
          const tsApi = cur ? Number(cur.trust_score ?? 0) || 0 : 0;
          if (!cur) {
            merged[k] = { review_count: rcRpc, trust_score: tsRpc };
          } else if (rcApi >= rcRpc) {
            merged[k] = { review_count: rcApi, trust_score: tsApi };
          } else {
            merged[k] = { review_count: rcRpc, trust_score: tsRpc };
          }
        }
        setBestInMetrics(merged);
      } catch {
        if (!cancelled) setBestInMetrics({});
      }
    };

    void refresh();

    return () => {
      cancelled = true;
    };
  }, [pathname, activeCountryCode, rotatingCategorySlugs]);

  useEffect(() => {
    if (reviewPage >= totalReviewPages) {
      setReviewPage(0);
    }
  }, [reviewPage, totalReviewPages]);

  useEffect(() => {
    setReviewPage(0);
  }, [selectedCountry]);

  useEffect(() => {
    reviewsScrollRef.current?.scrollTo({ left: 0 });
  }, [activeCountryCode]);

  useEffect(() => {
    let isMounted = true;
    const staticFallback: CategoryCard[] = LOOKING_FOR_CATEGORIES.map(
      ({ label, slug }) => ({ id: `static-${slug}`, name: label, slug })
    );

    const fetchCategories = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (!isMounted) return;

        if (error) {
          setCategoryCards(staticFallback);
          setVisibleCategories(staticFallback);
          return;
        }

        const items =
          (data as CategoryCard[] | null | undefined)?.filter(
            (item) => item.slug && item.name
          ) ?? [];

        // temporarily disable country filtering
        const countryFilter = null;
        if (countryFilter) {
          const supabase = supabaseBrowser();
          const { data: countryBusinesses } = await supabase
            .from("businesses")
            .select("category_slug")
            .eq("country_code", countryFilter)
            .not("category_slug", "is", null);

          if (!isMounted) return;

          const allowed = new Set(
            (countryBusinesses ?? [])
              .map((row) => row.category_slug)
              .filter(Boolean)
          );
          const filtered = items.filter((item) => allowed.has(item.slug));
          items.splice(0, items.length, ...filtered);
        }

        const bySlug = new Map(items.map((item) => [item.slug, item]));
        const ordered: CategoryCard[] = LOOKING_FOR_CATEGORIES.map(
          ({ label, slug }) => {
            const matched = bySlug.get(slug);
            if (matched) {
              return { ...matched, name: label };
            }
            return { id: `static-${slug}`, name: label, slug };
          }
        );

        setCategoryCards(ordered);
        setVisibleCategories(ordered);
      } catch {
        if (isMounted) {
          setCategoryCards(staticFallback);
          setVisibleCategories(staticFallback);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

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

  return (
    <main className="bg-white">
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
            Discover honest experiences. Read and write real customer reviews. Gain trusted business insights.
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
        metricsByBusinessId={bestInMetrics}
        countryCode={activeCountryCode}
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
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                aria-label="Scroll categories right"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
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
                isValidSlug((category.slug ?? "").trim().toLowerCase()) ? (
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
                  {" "}reviews
                </span>
                <div className="relative">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-sm shadow-sm hover:border-gray-300"
                    onClick={() => setIsCountryMenuOpen((prev) => !prev)}
                    aria-label="Change country for recent reviews, categories, and rankings"
                  >
                    <img
                      src={activeCountry.flagUrl}
                      alt={activeCountry.name}
                      className="h-3 w-5 object-cover"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Open country selection</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="ml-1 h-3 w-3 text-gray-500"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {isCountryMenuOpen && (
                    <div className="absolute right-0 z-10 mt-1 w-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          className="flex w-full items-center justify-center px-2 py-1 hover:bg-gray-50"
                          onClick={() =>
                            handleCountryChange(country.code as CountryCode)
                          }
                        >
                          <img
                            src={country.flagUrl}
                            alt={country.name}
                            className="h-3 w-5 object-cover"
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
              Real customer reviews in {activeCountry.name}, moderated for authenticity, newest
              first. The same country applies to categories and rankings on this page.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-gray-300 sm:rounded-md"
              aria-label="Previous reviews"
              onClick={() => navigateRecentReviews("prev")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-gray-300 sm:rounded-md"
              aria-label="Next reviews"
              onClick={() => navigateRecentReviews("next")}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
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
            allReviewPairs.length > 0 &&
            allReviewPairs.map((pair, idx) => (
              <div
                key={pair[0]?.review_id ?? `slide-${idx}`}
                data-review-slide
                className="flex w-[calc((100vw-3rem)*0.67)] min-w-[260px] shrink-0 snap-center flex-col gap-4"
              >
                {pair.map((review) => (
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
                ))}
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
            visibleReviews.length > 0 &&
            visibleReviews.map((review) => (
              <div
                key={review.review_id}
                className="transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl"
              >
                <RecentReviewCard
                  review={review}
                  showMoreAndReply={false}
                  variant="landing"
                  highlight={highlightedReviewId === review.review_id}
                />
              </div>
            ))}
        </div>

        {!isLoading && visibleReviews.length === 0 && !error && (
          <p className="mt-8 text-center text-sm text-gray-500 py-8">
            No reviews to show yet. Check back soon.
          </p>
        )}
      </section>

      {/* FAQ SECTION */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 md:py-12">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              <span className="relative inline-block">
                <span className="relative inline-block">
                  <span className="relative z-10">Frequently</span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
                {" "}Asked Questions
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Got questions? We've got answers. Delve into our Frequently Asked
              Questions (FAQs) section to find comprehensive information about
              your inquiries.
            </p>
          </div>

          {/* Mobile: show only a subset of FAQs */}
          <div className="mt-6 flex flex-col gap-4 lg:hidden">
            {faqItems.slice(0, 8).map((item) => {
              const isOpen = openFaqKey === item.question;
              return (
                <div
                  key={item.question}
                  className={`rounded-md border border-gray-200 bg-white transition-colors duration-200 hover:bg-[#F5F1EB] ${
                    isOpen ? "shadow-md border-[#2fb2a8]" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqKey((prev) =>
                        prev === item.question ? null : item.question
                      )
                    }
                    className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm text-[#0E0E0E] [&::-webkit-details-marker]:hidden"
                  >
                    <span className={isOpen ? "font-semibold" : "font-normal"}>
                      {item.question}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#2fb2a8]" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-4 text-sm text-gray-600">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: full FAQ grid */}
          <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-2">
            {faqColumns.map((column, columnIndex) => (
              <div
                key={`faq-column-${columnIndex}`}
                className="flex flex-col gap-4"
              >
                {column.map((item) => {
                  const isOpen = openFaqKey === item.question;
                  return (
                    <div
                      key={item.question}
                      className={`rounded-md border border-gray-200 bg-white transition-colors duration-200 hover:bg-[#F5F1EB] ${
                        isOpen ? "shadow-md border-[#2fb2a8]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqKey((prev) =>
                            prev === item.question ? null : item.question
                          )
                        }
                        className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm text-[#0E0E0E] [&::-webkit-details-marker]:hidden"
                      >
                        <span className={isOpen ? "font-semibold" : "font-normal"}>
                          {item.question}
                        </span>
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-[#2fb2a8]" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-5 pb-4 text-sm text-gray-600">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-md border border-[#1FAF9E] px-6 py-3 text-sm font-semibold text-[#1FAF9E]"
            >
              View All
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
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
                {" "}Blog Posts
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Insights, guides, and stories on building trust and growing your
              business.
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
                <h3 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      Looking to grow your business?
                    </span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h3>
                <p className="mt-3 text-sm text-[#0E0E0E]/80">
                  Grow your business with trusted customer reviews on Tellacity.
                  Collect authentic customer feedback, strengthen your online
                  reputation, and build trust with new customers by showcasing
                  real experiences from verified customers. Tellacity helps
                  businesses stand out in search results, earn credibility
                  through transparent reviews, and attract more customers who
                  are looking for reliable companies they can trust.
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
    </main>
  );
}

