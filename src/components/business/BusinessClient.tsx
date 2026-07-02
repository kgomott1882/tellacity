"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { CAROUSEL_NAV_BUTTON_CLASS } from "@/lib/carouselNavButton";
import { CarouselNavChevron } from "@/components/ui/CarouselNavChevron";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl, similarBusinessLogoUrl } from "@/lib/logo";
import SimilarBusinessLogo from "@/components/business/SimilarBusinessLogo";
import {
  formatBusinessTagLabel,
  businessTagPillClassName,
  mergeTagsForDisplay,
} from "@/lib/businessTags";
import {
  buildBusinessProfileIntro,
  buildCategoryBrowseHref,
  buildTagBrowseHref,
  profileDisplayTags,
} from "@/lib/businessProfileSeo";
import { formatBusinessAddress, getCountryName, cleanLocationField, cleanBusinessDisplayName } from "@/lib/address";
import { normalizeCountryCode } from "@/lib/country";
import { getActiveCountry } from "@/lib/getActiveCountry";
import { sanitizeText } from "@/lib/sanitizeText";
import RatingStars from "@/components/RatingStars";
import RecentReviewCard from "@/components/reviews/RecentReviewCard";
import BusinessProfilePhotos from "@/components/business/BusinessProfilePhotos";
import BusinessProfileResponses from "@/components/business/BusinessProfileResponses";
import {
  fetchBusinessProfileResponsesBundle,
  type BusinessProfileResponseEntry,
} from "@/lib/businessProfileResponses";
import BusinessProfileArticles, {
  type BusinessProfileArticleCard,
} from "@/components/business/BusinessProfileArticles";
import { buildBusinessCategoryArticlesHref } from "@/lib/articles/hubArticles";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp } from "@/components/ui/MotionWrapper";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { isBusinessPubliclyActive } from "@/lib/businessPublicAccess";
import { buildBusinessSignupClaimPrefillUrl } from "@/lib/businessSignupClaimPrefill";
import {
  BUSINESS_PROFILE_REVIEWS_CLIENT_PAGE_SIZE,
  fetchBusinessProfileReviewsPage,
  type BusinessProfileReview,
} from "@/lib/businessProfileReviews";
import type { PublishedReviewAggregates } from "@/lib/businessReviewJsonLd";

interface BusinessRow {
  address?: string | null;
  city?: string | null;
  country_code?: string | null;
  email?: string | null;
  [key: string]: unknown;
}

type Business = {
  id: string;
  name: string;
  slug: string;
  website: string;
  /** Business logo URL from businesses.logo_url. */
  logoUrl: string | null;
  trustScore: number | null;
  reviewCount: number;
  averageRating: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
  countryCode: string;
  address: string;
  city: string;
  description: string;
  categorySlug: string;
  categoryGroupSlug: string | null;
  categoryGroupName: string | null;
  categoryName: string | null;
  tags: string[];
  status: string;
  email: string;
  phone: string;
};

type Review = BusinessProfileReview;

type ReviewReply = {
  id: string;
  reviewId: string;
  body: string;
  createdAt: string;
};

type Star = 1 | 2 | 3 | 4 | 5;

type RatingCounts = Record<Star, number>;

type CategoryTrail = {
  groupName: string | null;
  groupSlug: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

/** Top slice from get_top_businesses_for_category_global , same source as category page. */
type TopRatedInCategory = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  trustScore: number;
  reviewCount: number;
};

const cleanDomain = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
};

const NO_COMPANY_DESCRIPTION_COPY =
  "This business has not provided a company description yet.";

const MIN_COMPANY_DESCRIPTION_LENGTH = 24;

/** Empty or legacy auto-generated SEO paragraph stored on `businesses.description`. */
function isOwnerWrittenBusinessDescription(
  text: string | null | undefined
): boolean {
  const t = (text ?? "").trim();
  if (!t) return false;
  const lower = t.toLowerCase();
  if (
    lower.startsWith("explore ") &&
    lower.includes("a company in the") &&
    lower.includes("tellacity collects")
  ) {
    return false;
  }
  if (
    /tellacity collects real customer reviews to help you understand/i.test(t)
  ) {
    return false;
  }
  if (/is listed on tellacity under/i.test(t)) {
    return false;
  }
  if (/read verified customer reviews/i.test(t) && /tellacity/i.test(t)) {
    return false;
  }
  if (/listed on tellacity/i.test(t) && /category|under /i.test(t)) {
    return false;
  }
  if (/\[unknown\]|\[null\]/i.test(t)) {
    return false;
  }
  return true;
}

function hasMeaningfulCompanyDescription(
  text: string | null | undefined,
): boolean {
  const trimmed = (text ?? "").trim();
  if (trimmed.length < MIN_COMPANY_DESCRIPTION_LENGTH) return false;
  return isOwnerWrittenBusinessDescription(trimmed);
}

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const buildWebsiteHref = (value: string | null | undefined) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const reviewSkeletons = Array.from({ length: 3 });

async function resolveBusinessRowBySlug(rawSlug: string) {
  const safeSlug = String(rawSlug ?? "").trim().toLowerCase();
  if (!safeSlug) return null;
  const sb = supabaseBrowser();

  const fetchBySlug = async (candidate: string) => {
    const { data, error } = await sb.rpc("get_business_by_slug", {
      p_slug: candidate,
    });
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row && typeof row === "object" ? row : null;
  };

  const exact = await fetchBySlug(safeSlug);
  if (exact) return exact;

  const { data: exactRaw } = await sb
    .from("businesses")
    .select("status")
    .eq("slug", safeSlug)
    .maybeSingle();
  if (exactRaw && !isBusinessPubliclyActive(exactRaw.status)) {
    return null;
  }

  const baseSlug = safeSlug.replace(/-\d+$/, "");
  if (baseSlug && baseSlug !== safeSlug) {
    const baseMatch = await fetchBySlug(baseSlug);
    if (baseMatch) return baseMatch;
    const { data: baseRaw } = await sb
      .from("businesses")
      .select("status")
      .eq("slug", baseSlug)
      .maybeSingle();
    if (baseRaw && !isBusinessPubliclyActive(baseRaw.status)) {
      return null;
    }
  }

  const prefix = (baseSlug || safeSlug).trim();
  if (!prefix) return null;

  const { data: nearest } = await sb
    .from("businesses")
    .select("slug")
    .eq("status", "active")
    .ilike("slug", `${prefix}%`)
    .order("review_count", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const nearestSlug = String(nearest?.slug ?? "").trim().toLowerCase();
  if (!nearestSlug) return null;
  return await fetchBySlug(nearestSlug);
}

function mapBusinessFromRow(row: BusinessRow | Record<string, unknown>): Business {
  const address = cleanLocationField(String(row.address ?? ""));
  const city = cleanLocationField(String(row.city ?? ""));
  const countryCode = String(row.country_code ?? "").trim();
  const email = String(row.email ?? "").trim();
  const phone = String(row.phone ?? "").trim();
  const logoUrlRaw = (String(row.logo_url ?? "").trim()) || null;
  const reviewCount = Number(row.review_count ?? 0);
  const averageRating = Number(row.average_rating ?? 0);

  return {
    id: String(row.id ?? ""),
    name: cleanBusinessDisplayName(String(row.name ?? "Business")),
    slug: String(row.slug ?? ""),
    website: cleanDomain(String(row.website_display ?? row.website ?? "")),
    logoUrl: normalizeLogoUrl(logoUrlRaw),
    trustScore: row.trust_score != null ? Number(row.trust_score) : null,
    reviewCount,
    averageRating,
    rating1Count: Number(row.rating_1_count ?? 0),
    rating2Count: Number(row.rating_2_count ?? 0),
    rating3Count: Number(row.rating_3_count ?? 0),
    rating4Count: Number(row.rating_4_count ?? 0),
    rating5Count: Number(row.rating_5_count ?? 0),
    countryCode: countryCode || String(row.country_code ?? ""),
    address,
    city,
    description: String(row.description ?? "").trim(),
    categorySlug: String(row.category_slug ?? ""),
    categoryGroupSlug: row.primary_group_slug
      ? String(row.primary_group_slug)
      : null,
    categoryGroupName: row.primary_group_name
      ? String(row.primary_group_name)
      : null,
    categoryName: row.category_name ? String(row.category_name) : null,
    tags: mergeTagsForDisplay(
      row.tags,
      row.secondary_category_slugs,
      (row.category_slug ?? null) as string | null,
    ),
    status: String(row.status ?? "active"),
    email,
    phone,
  };
}

type BusinessClientProps = {
  initialBusiness?: BusinessRow | null;
  initialBusinessPhotos?: BusinessPhotoPublic[];
  /**
   * Whether this business has a registered owner (i.e. has been claimed).
   * Derived from `businesses.owner_id` on the server and passed down so the
   * public profile can hide the "Claim this profile" teaser when not needed.
   */
  initialIsClaimed?: boolean;
  initialPublishedArticles?: BusinessProfileArticleCard[];
  /** First page of reviews from SSR (`/b/[slug]`). */
  initialReviews?: BusinessProfileReview[];
  initialTotalReviewCount?: number;
  /** Live published/visible aggregates — matches JSON-LD hero counts. */
  initialPublishedReviewAggregates?: PublishedReviewAggregates;
};

export default function BusinessClient({
  initialBusiness = null,
  initialBusinessPhotos,
  initialIsClaimed = false,
  initialPublishedArticles = [],
  initialReviews,
  initialTotalReviewCount,
  initialPublishedReviewAggregates,
}: BusinessClientProps) {
  const ssrReviewSeed =
    initialBusiness != null && Array.isArray(initialReviews);
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(() => {
    if (!initialBusiness || typeof initialBusiness !== "object") return null;
    return mapBusinessFromRow(initialBusiness);
  });
  const [reviews, setReviews] = useState<Review[]>(() =>
    ssrReviewSeed ? [...initialReviews!] : [],
  );
  const [repliesByReviewId, setRepliesByReviewId] = useState<
    Record<string, ReviewReply[]>
  >({});
  const [businessResponseEntries, setBusinessResponseEntries] = useState<
    BusinessProfileResponseEntry[]
  >([]);
  const [reviewsAwaitingResponseCount, setReviewsAwaitingResponseCount] =
    useState(0);
  const [isLoadingBusinessResponses, setIsLoadingBusinessResponses] =
    useState(true);
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(!initialBusiness);
  const [isLoadingReviews, setIsLoadingReviews] = useState(!ssrReviewSeed);
  const [notFound, setNotFound] = useState(false);
  const [reviewOffset, setReviewOffset] = useState(() =>
    ssrReviewSeed ? initialReviews!.length : 0,
  );
  const [hasMoreReviews, setHasMoreReviews] = useState(() => {
    if (!ssrReviewSeed) return false;
    const total = initialTotalReviewCount ?? initialReviews!.length;
    return initialReviews!.length < total;
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalReviewCount, setTotalReviewCount] = useState(() =>
    ssrReviewSeed
      ? (initialTotalReviewCount ?? initialReviews!.length)
      : 0,
  );
  const skipInitialReviewFetchRef = useRef(ssrReviewSeed);
  const [isTrustScoreOpen, setIsTrustScoreOpen] = useState(false);
  const [trustScoreStep, setTrustScoreStep] = useState(0);
  const [categoryTrail, setCategoryTrail] = useState<CategoryTrail | null>(null);
  const [reviewStats, setReviewStats] = useState<{
    total: number;
    average: number;
    counts: RatingCounts;
  } | null>(null);
  const [topRatedInCategory, setTopRatedInCategory] = useState<
    TopRatedInCategory[]
  >([]);
  const [topRatedInCategoryLoading, setTopRatedInCategoryLoading] =
    useState(false);
  const [relatedBusinesses, setRelatedBusinesses] = useState<
    TopRatedInCategory[]
  >([]);
  const [relatedBusinessesLoading, setRelatedBusinessesLoading] =
    useState(false);

  /** `/b/[slug]` public profile only: show top 3 in one row; other routes keep full list. */
  const isPublicBusinessProfile = pathname?.startsWith("/b/") ?? false;
  const topRatedForExploreRankings = useMemo(
    () =>
      isPublicBusinessProfile
        ? topRatedInCategory.slice(0, 3)
        : topRatedInCategory,
    [isPublicBusinessProfile, topRatedInCategory]
  );

  const relatedForMoreLikeThis = useMemo(
    () =>
      isPublicBusinessProfile
        ? relatedBusinesses.slice(0, 3)
        : relatedBusinesses,
    [isPublicBusinessProfile, relatedBusinesses]
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const scrollReviewsRowLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollReviewsRowRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [businessPhotos, setBusinessPhotos] = useState<BusinessPhotoPublic[]>(
    () => initialBusinessPhotos ?? []
  );
  const [duplicateNoticeOpen, setDuplicateNoticeOpen] = useState(false);
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
    try {
      if (searchParams.get("reviewNotice") === "duplicate_review") {
        setDuplicateNoticeOpen(true);
      }
    } catch {
      // ignore
    }
  }, [searchParams]);

  useEffect(() => {
    setActiveCountry(getActiveCountry());
    const handleSync = () => setActiveCountry(getActiveCountry());
    window.addEventListener("storage", handleSync);
    window.addEventListener("tellacity-country-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("tellacity-country-change", handleSync);
    };
  }, []);

  useEffect(() => {
    if (initialBusinessPhotos === undefined) return;
    setBusinessPhotos(initialBusinessPhotos);
  }, [initialBusinessPhotos]);

  useEffect(() => {
    if (!business?.id) return;
    if (initialBusinessPhotos !== undefined) return;

    let cancelled = false;
    (async () => {
      const sb = supabaseBrowser();
      const primaryPhotosRes = await applyBusinessPhotosOrdering(
        sb
          .from("business_photos")
          .select("id, url, section, created_at, is_cover, sort_order, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url")
          .eq("business_id", business.id)
          .eq("status", "published")
          .eq("is_live", true)
      );
      const { data, error } = primaryPhotosRes.error
        ? await applyBusinessPhotosOrdering(
            sb
              .from("business_photos")
              .select("id, url, section, created_at, is_cover, sort_order")
              .eq("business_id", business.id)
              .eq("status", "published")
              .eq("is_live", true)
          )
        : primaryPhotosRes;
      if (cancelled || error) return;
      const rows = (data ?? []) as Array<{
        id: string;
        url: string;
        section?: string | null;
        sort_order?: number | null;
        created_at?: string | null;
        is_cover?: boolean | null;
        preview_zoom?: number | null;
        preview_x?: number | null;
        preview_y?: number | null;
        preview_frame?: string | null;
        product_name?: string | null;
        product_description?: string | null;
        product_price?: number | null;
        product_currency?: string | null;
        product_redirect_url?: string | null;
      }>;
      setBusinessPhotos(
        rows
          .filter((r) => r.id && r.url)
          .map((r) => ({
            id: r.id,
            url: r.url,
            section: String(r.section ?? "gallery"),
            sort_order: typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order) || 0,
            created_at: r.created_at ?? null,
            is_cover: r.is_cover === true,
            preview_zoom: Math.max(1, Math.min(2.5, Number(r.preview_zoom) || 1)),
            preview_x: Math.max(0, Math.min(100, Number(r.preview_x) || 50)),
            preview_y: Math.max(0, Math.min(100, Number(r.preview_y) || 50)),
            preview_frame:
              String(r.preview_frame ?? "landscape").toLowerCase() === "portrait"
                ? "portrait"
                : "landscape",
            product_name: r.product_name ?? null,
            product_description: r.product_description ?? null,
            product_price: typeof r.product_price === "number" ? r.product_price : null,
            product_currency:
              typeof r.product_currency === "string" && r.product_currency.trim()
                ? r.product_currency.trim().toUpperCase().slice(0, 3)
                : "USD",
            product_redirect_url:
              typeof r.product_redirect_url === "string" && r.product_redirect_url.trim()
                ? r.product_redirect_url.trim()
                : null,
          }))
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [business?.id, initialBusinessPhotos]);

  useEffect(() => {
    if (initialBusiness) {
      return;
    }
    let isMounted = true;

    const fetchBusiness = async () => {
      if (!slug) {
        setNotFound(true);
        setIsLoadingBusiness(false);
        setBusiness(null);
        return;
      }

      setIsLoadingBusiness(true);
      setNotFound(false);
      setBusiness(null);

      const businessRow = await resolveBusinessRowBySlug(slug);

      if (!isMounted) return;

      if (!businessRow || typeof businessRow !== "object") {
        setNotFound(true);
        setBusiness(null);
        setIsLoadingBusiness(false);
        return;
      }

      setBusiness(mapBusinessFromRow(businessRow as Record<string, unknown>));
      setIsLoadingBusiness(false);
    };

    fetchBusiness();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!business?.name) {
      return;
    }

    // Server metadata is the source of truth for title/description.
  }, [business, siteUrl]);

  useEffect(() => {
    let isMounted = true;

    const fetchTrail = async () => {
      if (!business?.categorySlug) {
        setCategoryTrail(null);
        return;
      }

      if (business.categoryName || business.categoryGroupName) {
        setCategoryTrail({
          groupName: business.categoryGroupName ?? null,
          groupSlug: business.categoryGroupSlug ?? null,
          categoryName: business.categoryName ?? null,
          categorySlug: business.categorySlug ?? null,
        });
        return;
      }

      const sb = supabaseBrowser();
      const { data } = await sb
        .from("categories")
        .select("name, slug, group_name, group_slug")
        .eq("slug", business.categorySlug)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setCategoryTrail({
        groupName: data?.group_name ?? null,
        groupSlug: data?.group_slug ?? null,
        categoryName: data?.name ?? null,
        categorySlug: data?.slug ?? business.categorySlug ?? null,
      });
    };

    fetchTrail();

    return () => {
      isMounted = false;
    };
  }, [business?.categorySlug, business?.categoryGroupName, business?.categoryName]);

  useEffect(() => {
    const cat = business?.categorySlug?.trim();
    if (!cat || !business?.id) {
      setTopRatedInCategory([]);
      setTopRatedInCategoryLoading(false);
      return;
    }

    let isMounted = true;
    setTopRatedInCategoryLoading(true);

    const country = normalizeCountryCode(business.countryCode);

    const run = async () => {
      const { data, error } = await supabaseBrowser().rpc(
        "get_top_businesses_for_category_global",
        {
          p_category_slug: cat,
          p_country_code: country,
          p_min_rating: null,
          p_limit: 40,
          p_offset: 0,
        }
      );

      if (!isMounted) return;
      setTopRatedInCategoryLoading(false);

      if (error || !Array.isArray(data)) {
        setTopRatedInCategory([]);
        return;
      }

      const mapped: TopRatedInCategory[] = (
        data as Array<Record<string, unknown>>
      )
        .map((row, index) => {
          const slug = String(row.slug ?? "").trim().toLowerCase();
          if (!/^[a-z0-9-]+$/.test(slug)) return null;
          return {
            id: String(row.id ?? `top-${index}-${slug}`),
            slug,
            name: String(row.name ?? "").trim() || "Business",
            logoUrl: similarBusinessLogoUrl({
              resolved_logo_url: row.resolved_logo_url as string | null,
              logo_url: row.logo_url as string | null,
              website: (row.website_display as string | null) ?? (row.website as string | null),
            }),
            trustScore: Number(row.trust_score ?? 0),
            reviewCount: Number(row.review_count ?? 0),
          };
        })
        .filter((row): row is TopRatedInCategory => row !== null)
        .sort((a, b) => {
          if (b.trustScore !== a.trustScore) {
            return b.trustScore - a.trustScore;
          }
          if (b.reviewCount !== a.reviewCount) {
            return b.reviewCount - a.reviewCount;
          }
          return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        })
        .slice(0, 8);

      setTopRatedInCategory(mapped);
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [business?.id, business?.categorySlug, business?.countryCode]);

  useEffect(() => {
    const cat = business?.categorySlug?.trim();
    const country = business?.countryCode
      ? normalizeCountryCode(business.countryCode)
      : null;
    const bid = business?.id;
    if (!cat || !country || !bid) {
      setRelatedBusinesses([]);
      setRelatedBusinessesLoading(false);
      return;
    }

    let isMounted = true;
    setRelatedBusinessesLoading(true);

    const run = async () => {
      const { data, error } = await supabaseBrowser()
        .from("businesses")
        .select(
          "id, name, slug, logo_url, website, website_display, trust_score, review_count",
        )
        .eq("category_slug", cat)
        .eq("country_code", country)
        .neq("id", bid)
        .eq("status", "active")
        .order("trust_score", { ascending: false, nullsFirst: false })
        .order("review_count", { ascending: false })
        .limit(14);

      if (!isMounted) return;
      setRelatedBusinessesLoading(false);

      if (error || !Array.isArray(data)) {
        setRelatedBusinesses([]);
        return;
      }

      const topIds = new Set(topRatedInCategory.map((t) => t.id));
      const mapped = (data as Array<Record<string, unknown>>)
        .map((row, index) => {
          const slug = String(row.slug ?? "").trim().toLowerCase();
          if (!/^[a-z0-9-]+$/.test(slug)) return null;
          const id = String(row.id ?? `rel-${index}-${slug}`);
          if (topIds.has(id)) return null;
          return {
            id,
            slug,
            name: String(row.name ?? "").trim() || "Business",
            logoUrl: similarBusinessLogoUrl({
              logo_url: row.logo_url as string | null,
              website:
                (row.website_display as string | null) ??
                (row.website as string | null),
            }),
            trustScore: Number(row.trust_score ?? 0),
            reviewCount: Number(row.review_count ?? 0),
          };
        })
        .filter((row): row is TopRatedInCategory => row !== null)
        .slice(0, 6);

      setRelatedBusinesses(mapped);
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [
    business?.id,
    business?.categorySlug,
    business?.countryCode,
    topRatedInCategory,
  ]);

  useEffect(() => {
    if (!business?.id) {
      setReviewStats(null);
      return;
    }

    let isMounted = true;
    const businessId = business.id;

    const fetchReviewStats = async () => {
      const sb = supabaseBrowser();
      const { data, error, count } = await sb
        .from("reviews")
        .select("rating", { count: "exact" })
        .eq("business_id", businessId)
        .eq("status", "published")
        .in("visibility", ["visible", "landing_hidden"]);

      if (!isMounted || error) {
        return;
      }

      const counts: RatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalRatings = 0;
      let sum = 0;

      (data ?? []).forEach((row) => {
        const value = Math.round(Number(row.rating ?? 0));
        if (value >= 1 && value <= 5) {
          const star = value as Star;
          counts[star] += 1;
          totalRatings += 1;
          sum += value;
        }
      });

      const total = count ?? totalRatings;
      const average = totalRatings > 0 ? sum / totalRatings : 0;

      setReviewStats({
        total,
        average,
        counts: counts as RatingCounts,
      });
    };

    const fetchReplies = async (
      reviewList: Review[],
      replaceExisting: boolean
    ) => {
      const reviewIds = reviewList.map((item) => item.id);
      if (reviewIds.length === 0) {
        if (replaceExisting) {
          setRepliesByReviewId({});
        }
        return;
      }

      const sb = supabaseBrowser();
      const { data, error } = await sb
        .from("review_replies")
        .select("id, review_id, body, created_at, author_role")
        .in("review_id", reviewIds)
        .eq("author_role", "business")
        .order("created_at", { ascending: true });

      if (!isMounted || error) {
        return;
      }

      const grouped = (data ?? []).reduce<Record<string, ReviewReply[]>>(
        (acc, reply) => {
          const reviewId = reply.review_id;
          if (!acc[reviewId]) {
            acc[reviewId] = [];
          }
          acc[reviewId].push({
            id: reply.id,
            reviewId,
            body: reply.body ?? "",
            createdAt: formatDate(reply.created_at),
          });
          return acc;
        },
        {}
      );

      const mergeOwnerResponses = (
        reviewList: Review[],
        replyMap: Record<string, ReviewReply[]>,
      ): Record<string, ReviewReply[]> => {
        const merged = { ...replyMap };
        for (const review of reviewList) {
          const ownerBody = review.ownerResponse?.trim();
          if (!ownerBody) continue;
          const existing = merged[review.id] ?? [];
          const alreadyPresent = existing.some(
            (reply) => reply.body.trim().toLowerCase() === ownerBody.toLowerCase(),
          );
          if (alreadyPresent) continue;
          merged[review.id] = [
            {
              id: `owner-${review.id}`,
              reviewId: review.id,
              body: ownerBody,
              createdAt: review.ownerResponseAt ?? "",
            },
            ...existing,
          ];
        }
        return merged;
      };

      const withOwnerResponses = mergeOwnerResponses(reviewList, grouped);

      if (replaceExisting) {
        setRepliesByReviewId(withOwnerResponses);
      } else {
        setRepliesByReviewId((prev) => ({ ...prev, ...withOwnerResponses }));
      }
    };

    const fetchReviewsPage = async (
      offset = 0,
      append = false,
      options?: { silent?: boolean }
    ) => {
      const silent = options?.silent === true;
      const sb = supabaseBrowser();
      const { reviews: mapped, totalCount } = await fetchBusinessProfileReviewsPage(
        sb,
        businessId,
        offset,
        BUSINESS_PROFILE_REVIEWS_CLIENT_PAGE_SIZE,
      );

      if (!isMounted) {
        return;
      }

      setReviews((prev) => (append ? [...prev, ...mapped] : mapped));
      void fetchReplies(mapped, !append);
      setTotalReviewCount(totalCount);
      setHasMoreReviews(offset + mapped.length < totalCount);
      setReviewOffset(offset + mapped.length);
    };

    const loadReviewsAndStats = async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      const skipInitialPageFetch = skipInitialReviewFetchRef.current;
      if (skipInitialReviewFetchRef.current) {
        skipInitialReviewFetchRef.current = false;
      }

      if (!silent && !skipInitialPageFetch) {
        setReviews([]);
        setRepliesByReviewId({});
        setReviewOffset(0);
        setHasMoreReviews(false);
        setIsLoadingReviews(true);
      }
      await fetchReviewStats();
      if (skipInitialPageFetch) {
        if (initialReviews && initialReviews.length > 0) {
          void fetchReplies(initialReviews, true);
        }
      } else if (!silent) {
        try {
          await fetchReviewsPage(0, false, { silent });
        } catch (err) {
          console.error("[BusinessClient] fetch reviews:", err);
        }
      }
      if (isMounted && !silent) {
        setIsLoadingReviews(false);
      }
    };

    void loadReviewsAndStats({ silent: false });

    const onVisible = () => {
      if (document.visibilityState !== "visible" || !isMounted) return;
      void loadReviewsAndStats({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisible);

    const onPageShow = (ev: PageTransitionEvent) => {
      if (!isMounted) return;
      if (ev.persisted) void loadReviewsAndStats({ silent: true });
    };
    window.addEventListener("pageshow", onPageShow);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [business?.id, pathname]);

  useEffect(() => {
    const businessId = business?.id;
    if (!businessId) {
      setBusinessResponseEntries([]);
      setReviewsAwaitingResponseCount(0);
      setIsLoadingBusinessResponses(false);
      return;
    }

    let isMounted = true;
    setIsLoadingBusinessResponses(true);

    const loadBusinessResponses = async () => {
      const sb = supabaseBrowser();
      const bundle = await fetchBusinessProfileResponsesBundle(sb, businessId);
      if (!isMounted) return;
      setBusinessResponseEntries(bundle.entries);
      setReviewsAwaitingResponseCount(bundle.awaitingResponseCount);
      setIsLoadingBusinessResponses(false);
    };

    void loadBusinessResponses();

    const refresh = () => {
      if (document.visibilityState !== "visible" || !isMounted) return;
      void loadBusinessResponses();
    };
    document.addEventListener("visibilitychange", refresh);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [business?.id]);

  const ratingCounts = useMemo(() => {
    const empty = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0 };
    if (!business) {
      return empty;
    }

    if (reviewStats) {
      const total =
        reviewStats.counts[1] +
        reviewStats.counts[2] +
        reviewStats.counts[3] +
        reviewStats.counts[4] +
        reviewStats.counts[5];
      return { ...reviewStats.counts, total };
    }

    const counts = {
      1: business.rating1Count ?? 0,
      2: business.rating2Count ?? 0,
      3: business.rating3Count ?? 0,
      4: business.rating4Count ?? 0,
      5: business.rating5Count ?? 0,
    };
    const total =
      counts[1] + counts[2] + counts[3] + counts[4] + counts[5];

    if (total > 0) {
      return { ...counts, total };
    }

    if (reviews.length === 0) {
      return empty;
    }

    const aggregated = reviews.reduce(
      (acc, review) => {
        const rounded = Math.round(review.rating);
        if (rounded >= 1 && rounded <= 5) {
          const star = rounded as Star;
          acc[star] += 1;
          acc.total += 1;
        }
        return acc;
      },
      { ...empty }
    );

    return aggregated;
  }, [business, reviewStats, reviews]);

  const derivedAverageRating = useMemo(() => {
    if (!business) {
      return 0;
    }

    if (reviewStats && reviewStats.average > 0) {
      return reviewStats.average;
    }

    if (
      initialPublishedReviewAggregates &&
      initialPublishedReviewAggregates.averageRating > 0
    ) {
      return initialPublishedReviewAggregates.averageRating;
    }

    if (ratingCounts.total > 0) {
      const weighted =
        ratingCounts[1] * 1 +
        ratingCounts[2] * 2 +
        ratingCounts[3] * 3 +
        ratingCounts[4] * 4 +
        ratingCounts[5] * 5;
      return weighted / ratingCounts.total;
    }

    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      return sum / reviews.length;
    }

    if (business.averageRating > 0) {
      return business.averageRating;
    }

    return 0;
  }, [
    business,
    reviewStats,
    ratingCounts,
    reviews,
    initialPublishedReviewAggregates,
  ]);

  const derivedReviewCount = useMemo(() => {
    if (reviewStats) {
      return reviewStats.total;
    }
    if (totalReviewCount > 0) {
      return totalReviewCount;
    }
    if (
      initialPublishedReviewAggregates &&
      initialPublishedReviewAggregates.reviewCount > 0
    ) {
      return initialPublishedReviewAggregates.reviewCount;
    }
    return reviews.length;
  }, [
    reviewStats,
    totalReviewCount,
    initialPublishedReviewAggregates,
    reviews.length,
  ]);

  const showBusinessResponsesSection = useMemo(() => {
    if (isLoadingBusinessResponses) return false;
    if (derivedReviewCount === 0) return false;
    return reviewsAwaitingResponseCount > 0;
  }, [
    isLoadingBusinessResponses,
    derivedReviewCount,
    reviewsAwaitingResponseCount,
  ]);

  const categoryPublicLabel = useMemo(() => {
    const slug = business?.categorySlug?.trim();
    if (!slug) return "";
    const fromBusiness = business?.categoryName?.trim();
    if (fromBusiness) return sanitizeText(fromBusiness);
    const fromTrail = categoryTrail?.categoryName?.trim();
    if (fromTrail) return sanitizeText(fromTrail);
    return formatBusinessTagLabel(slug);
  }, [
    business?.categorySlug,
    business?.categoryName,
    categoryTrail?.categoryName,
  ]);

  const profileTagSlugs = useMemo(
    () =>
      profileDisplayTags(business?.tags ?? [], business?.categorySlug ?? null),
    [business?.tags, business?.categorySlug],
  );

  const profileTagline = useMemo(() => {
    if (!business?.name?.trim()) return "";
    const intro = buildBusinessProfileIntro({
      name: business.name,
      city: business.city,
      countryCode: business.countryCode,
      categoryLabel: categoryPublicLabel || null,
      tagSlugs: profileTagSlugs,
      reviewCount: derivedReviewCount,
    }).trim();
    if (intro) return intro;
    return `Tellacity collects verified customer reviews to help people make informed decisions. Read real ${sanitizeText(business.name)} reviews or share your experience.`;
  }, [
    business?.name,
    business?.city,
    business?.countryCode,
    categoryPublicLabel,
    profileTagSlugs,
    derivedReviewCount,
  ]);

  const categoryArticlesHref = useMemo(() => {
    const slug = business?.categorySlug?.trim();
    if (!slug) return null;
    return buildBusinessCategoryArticlesHref(slug);
  }, [business?.categorySlug]);

  const rankingsCountryCode =
    (business?.countryCode || "US").trim().toUpperCase() || "US";

  const rankingsCountryName = getCountryName(rankingsCountryCode) || rankingsCountryCode;

  /**
   * SSR + first paint use the business country so hrefs match hydration.
   * After mount, `activeCountry` updates from navbar/localStorage preference.
   */
  const categoryBrowseCountryCode = useMemo(() => {
    const code = normalizeCountryCode(
      activeCountry ?? business?.countryCode ?? undefined,
    );
    return code || "US";
  }, [activeCountry, business?.countryCode]);

  const categoryListingsQs = `?country=${encodeURIComponent(categoryBrowseCountryCode)}`;

  const businessLogoUrl = similarBusinessLogoUrl({
    resolved_logo_url: business?.logoUrl ?? null,
    logo_url: business?.logoUrl ?? null,
    website: business?.website ?? null,
  });
  if (notFound && !isLoadingBusiness) {
    return (
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            Business not found
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            This business is not available.
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="business-cinematic">
      <HomeScrollProgress />
      {duplicateNoticeOpen && (
        <div className="fixed inset-x-0 top-16 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-md items-start gap-3 rounded-xl bg-[#124541] px-4 py-3 text-sm text-white shadow-lg">
            <div className="flex-1">
              <p className="font-semibold">You've already reviewed this business</p>
              <p className="mt-1 text-xs text-white/80">
                To manage or update your review, please sign in from the login page and edit it from your account.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDuplicateNoticeOpen(false)}
              className="ml-2 text-white/80 hover:text-white"
              aria-label="Close notice"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-6">
        <div className="biz-profile-hero biz-profile-hero-animate">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <nav className="biz-breadcrumb-nav min-w-0 flex-1 text-xs">
            <Link href={`/categories${categoryListingsQs}`}>
              Categories
            </Link>
            {categoryTrail?.groupName && categoryTrail?.groupSlug && (
              <>
                <span className="mx-2">›</span>
                <Link
                  href={`/categories/${categoryTrail.groupSlug}${categoryListingsQs}`}
                >
                  {sanitizeText(categoryTrail.groupName)}
                </Link>
              </>
            )}
            {categoryTrail?.categoryName && categoryTrail?.categorySlug && (
              <>
                <span className="mx-2">›</span>
                <Link
                  href={`/categories/${categoryTrail.categorySlug}${categoryListingsQs}`}
                >
                  {sanitizeText(categoryTrail.categoryName)}
                </Link>
              </>
            )}
            <span className="mx-2">›</span>
            <span className="biz-breadcrumb-current">
              {sanitizeText(business?.name ?? "Business")}
            </span>
          </nav>
          {!initialIsClaimed && business?.id ? (
            <Link
              href={buildBusinessSignupClaimPrefillUrl({
                businessId: business.id,
                businessName: business.name,
                businessSlug: business.slug ?? null,
                website: business.website ?? null,
              })}
              rel="nofollow"
              className="biz-btn-claim inline-flex shrink-0 items-center self-start rounded-full px-3 py-1.5 text-xs font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/40"
            >
              Claim this Profile - Free
            </Link>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <SimilarBusinessLogo
              key={`${business?.id ?? slug}-${businessLogoUrl ?? "none"}`}
              logoUrl={businessLogoUrl}
              nameForAlt={business?.name ?? "Business"}
              variant="profile"
            />
            <div className="min-w-0 flex-1">
              {isLoadingBusiness && !business ? (
                <div className="space-y-3">
                  <div className="h-7 w-64 rounded bg-gray-100" />
                  <div className="h-4 w-40 rounded bg-gray-100" />
                  <div className="h-4 w-32 rounded bg-gray-100" />
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-center gap-2">
                    <h1>
                      {sanitizeText(business?.name ?? "")} Reviews
                    </h1>
                    {derivedReviewCount > 0 && (
                      <img
                        src="/brand/Tellacity%20Vefication%20Batch.png"
                        alt="Tellacity verified reviews"
                        className="biz-verified-badge h-5 w-5 shrink-0"
                      />
                    )}
                  </div>
                  <div className="biz-hero-meta mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      Reviews {derivedReviewCount.toLocaleString()}
                    </span>
                    <span aria-hidden>•</span>
                    <div className="flex items-center gap-1">
                      <RatingStars
                        rating={derivedAverageRating}
                        size={14}
                        className="biz-rating-gold"
                      />
                      <span className="font-semibold text-[#0A0A0A]">
                        {derivedAverageRating.toFixed(1)}
                      </span>
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500">
                        i
                      </span>
                    </div>
                  </div>
                  {(() => {
                    const primaryLabel =
                      (categoryTrail?.categoryName &&
                        sanitizeText(categoryTrail.categoryName)) ||
                      (categoryTrail?.groupName &&
                        sanitizeText(categoryTrail.groupName)) ||
                      (business?.categorySlug?.trim()
                        ? formatBusinessTagLabel(business.categorySlug)
                        : "");
                    if (!primaryLabel) return null;
                    const categorySlug = business?.categorySlug?.trim();
                    return (
                      <p className="mt-2 text-sm text-gray-600">
                        {categorySlug ? (
                          <Link
                            href={buildCategoryBrowseHref(
                              categorySlug,
                              business?.countryCode,
                            )}
                            className="text-[#0E4A42] underline-offset-2 hover:underline"
                          >
                            {primaryLabel}
                          </Link>
                        ) : (
                          primaryLabel
                        )}
                      </p>
                    );
                  })()}
                  {profileTagSlugs.length > 0 ? (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        Topics:
                      </span>
                      {profileTagSlugs.map((tagSlug, index) => (
                        <Link
                          key={tagSlug}
                          href={buildTagBrowseHref(tagSlug, business?.countryCode)}
                          className={businessTagPillClassName(index)}
                        >
                          {formatBusinessTagLabel(tagSlug)}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {profileTagline ? (
                    <p className="biz-hero-tagline mt-3 max-w-2xl text-sm text-gray-600">
                      {profileTagline}
                    </p>
                  ) : null}
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={
                    business?.slug
                      ? `/write-review?businessSlug=${encodeURIComponent(
                          business.slug
                        )}`
                      : "/write-review"
                  }
                  className="biz-btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/40"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                  </svg>
                  Write a review
                </Link>
                {business?.website ? (
                  <a
                    href={buildWebsiteHref(business.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="biz-btn-outline inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/30"
                  >
                    Visit website
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3h7v7" />
                      <path d="M10 14L21 3" />
                      <path d="M21 14v7h-7" />
                      <path d="M3 10V3h7" />
                      <path d="M3 21h7" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="space-y-0">
          <FadeUp className="biz-summary-section">
              <div>
                <h2 className="biz-section-title text-lg">
                  <span className="biz-section-accent">Review</span> summary
                </h2>
                <p className="biz-section-sub mt-3 text-sm">
                  Reviews are written by real customers and moderated for authenticity.
                  This breakdown shows how many reviews fall into each star level,
                  helping you see the overall pattern of feedback. The TrustScore
                  summary is calculated from verified reviews, response behaviour, and
                  other platform signals.
                </p>

                <div className="biz-summary-card mt-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="biz-summary-score">
                        {business ? derivedAverageRating.toFixed(1) : "0.0"}
                      </div>
                      <p className="biz-summary-label mt-1 text-sm">
                        {derivedAverageRating >= 4.5
                          ? "Excellent"
                          : derivedAverageRating >= 3.5
                          ? "Great"
                          : derivedAverageRating >= 2.5
                          ? "Average"
                          : derivedAverageRating > 0
                          ? "Poor"
                          : "No reviews yet"}
                      </p>
                      <div className="mt-2">
                        <RatingStars
                          rating={derivedAverageRating}
                          size={16}
                          className="biz-rating-gold"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {derivedReviewCount.toLocaleString()} reviews
                      </p>
                    </div>
                    <div className="biz-star-bars w-full max-w-sm space-y-2">
                      {[
                        { label: "5-star", count: ratingCounts[5] ?? 0 },
                        { label: "4-star", count: ratingCounts[4] ?? 0 },
                        { label: "3-star", count: ratingCounts[3] ?? 0 },
                        { label: "2-star", count: ratingCounts[2] ?? 0 },
                        { label: "1-star", count: ratingCounts[1] ?? 0 },
                      ].map((row) => {
                        const total =
                          ratingCounts.total ||
                          derivedReviewCount ||
                          1;
                        const pct = Math.round((row.count / total) * 100);
                        return (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="biz-star-bar-label">
                              {row.label}
                            </span>
                            <div className="biz-star-bar-track">
                              <div
                                className="biz-star-bar-fill"
                                style={
                                  {
                                    "--bar-pct": `${pct}%`,
                                  } as React.CSSProperties
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-4 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setTrustScoreStep(0);
                        setIsTrustScoreOpen(true);
                      }}
                      className="biz-trust-link inline-flex items-center gap-2"
                    >
                      How is the TrustScore calculated?
                    </button>
                  </div>
                </div>
              </div>
          </FadeUp>

            <FadeUp className="biz-reviews-section">
              <div className="flex items-center justify-between gap-3">
                <h2 className="biz-section-title text-lg">
                  Customer reviews of {sanitizeText(business?.name ?? "Business")}
                </h2>
                <span className="biz-count-pill shrink-0">
                  {derivedReviewCount.toLocaleString()} total
                </span>
              </div>
              <p className="biz-section-sub mt-2 text-sm">
                Read real experiences from customers who have interacted with{" "}
                {sanitizeText(business?.name ?? "this business")}. Reviews are
                moderated for authenticity and can be reported if they violate
                platform rules. Reading several reviews helps you understand
                patterns in service, quality, and reliability before you decide.
              </p>
              <div className="mt-4 space-y-4">
                {isLoadingReviews && (
                  <div className="flex gap-4 overflow-hidden pb-2">
                    {reviewSkeletons.map((_, index) => (
                      <div
                        key={`review-skeleton-${index}`}
                        className="h-[220px] w-[min(85vw,380px)] shrink-0 rounded-xl border border-gray-200 p-4"
                      >
                        <div className="h-4 w-40 rounded bg-gray-100" />
                        <div className="mt-3 h-3 w-full rounded bg-gray-100" />
                        <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                )}

                {!isLoadingReviews && reviews.length === 0 && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">
                      Be the first to review {sanitizeText(business?.name ?? "this business")}
                    </p>
                    <Link
                      href={
                        business?.slug
                          ? `/write-review?businessSlug=${encodeURIComponent(
                              business.slug
                            )}`
                          : "/write-review"
                      }
                      className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                    >
                      Write a review
                    </Link>
                  </div>
                )}

                {!isLoadingReviews && reviews.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      aria-label="Scroll reviews left"
                      onClick={scrollReviewsRowLeft}
                      className={`biz-carousel-nav ${CAROUSEL_NAV_BUTTON_CLASS} absolute -left-3 top-[40%] z-10 opacity-90 transition-opacity hover:opacity-100 sm:-left-4`}
                    >
                      <CarouselNavChevron dir="left" />
                    </button>
                    <div
                      ref={scrollContainerRef}
                      className="biz-reviews-carousel flex gap-4 overflow-x-auto scroll-smooth pb-2"
                    >
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="biz-review-card-wrap w-[min(85vw,380px)] shrink-0 self-stretch"
                        >
                          <RecentReviewCard
                            variant="profile"
                            className="h-full"
                            review={{
                              id: review.id,
                              rating: review.rating,
                              title: review.title,
                              body: review.body,
                              reviewer_name: review.reviewerName,
                              created_at:
                                review.createdAtRaw ?? undefined,
                              like_count: review.likeCount,
                              product_name: review.productName ?? undefined,
                              business_slug: business?.slug ?? undefined,
                              business_name: business?.name,
                              website: business?.website,
                              logo_url: business?.logoUrl ?? undefined,
                            }}
                            businessReplies={
                              repliesByReviewId[review.id] ?? []
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      aria-label="Scroll reviews right"
                      onClick={scrollReviewsRowRight}
                      className={`biz-carousel-nav ${CAROUSEL_NAV_BUTTON_CLASS} absolute -right-3 top-[40%] z-10 opacity-90 transition-opacity hover:opacity-100 sm:-right-4`}
                    >
                      <CarouselNavChevron dir="right" />
                    </button>
                  </div>
                )}
                {!isLoadingReviews && reviews.length > 0 && (
                  <p className="mt-4 text-xs text-gray-500">
                    See all reviews and trust signals on the{" "}
                    <Link
                      href="/for-business"
                      className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
                    >
                      Tellacity Review Platform
                    </Link>
                    .
                  </p>
                )}
                {!isLoadingReviews && hasMoreReviews && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!business?.id || isLoadingMore) {
                          return;
                        }
                        setIsLoadingMore(true);
                        const offset = reviewOffset;

                        try {
                          const sb = supabaseBrowser();
                          const { reviews: mapped, totalCount } =
                            await fetchBusinessProfileReviewsPage(
                              sb,
                              business.id,
                              offset,
                              BUSINESS_PROFILE_REVIEWS_CLIENT_PAGE_SIZE,
                            );

                          setReviews((prevReviews) => [
                            ...prevReviews,
                            ...mapped,
                          ]);
                          if (mapped.length > 0) {
                            const reviewIds = mapped.map((item) => item.id);
                            const { data: replyData } = await sb
                              .from("review_replies")
                              .select(
                                "id, review_id, body, created_at, author_role"
                              )
                              .in("review_id", reviewIds)
                              .eq("author_role", "business")
                              .order("created_at", { ascending: true });

                            const grouped =
                              (replyData ?? []).reduce<Record<string, ReviewReply[]>>(
                                (acc, reply) => {
                                  const reviewId = reply.review_id;
                                  if (!acc[reviewId]) {
                                    acc[reviewId] = [];
                                  }
                                  acc[reviewId].push({
                                    id: reply.id,
                                    reviewId,
                                    body: reply.body ?? "",
                                    createdAt: formatDate(reply.created_at),
                                  });
                                  return acc;
                                },
                                {},
                              );

                            const merged = { ...grouped };
                            for (const review of mapped) {
                              const ownerBody = review.ownerResponse?.trim();
                              if (!ownerBody) continue;
                              const existing = merged[review.id] ?? [];
                              const alreadyPresent = existing.some(
                                (reply) =>
                                  reply.body.trim().toLowerCase() ===
                                  ownerBody.toLowerCase(),
                              );
                              if (alreadyPresent) continue;
                              merged[review.id] = [
                                {
                                  id: `owner-${review.id}`,
                                  reviewId: review.id,
                                  body: ownerBody,
                                  createdAt: review.ownerResponseAt ?? "",
                                },
                                ...existing,
                              ];
                            }

                            setRepliesByReviewId((prev) => ({
                              ...prev,
                              ...merged,
                            }));
                          }
                          setTotalReviewCount(totalCount);
                          setHasMoreReviews(
                            offset + mapped.length < totalCount,
                          );
                          setReviewOffset(offset + mapped.length);
                        } catch (err) {
                          console.error("[BusinessClient] load more reviews:", err);
                        } finally {
                          setIsLoadingMore(false);
                        }
                      }}
                      className="rounded-full border border-[#1FAF9E] px-6 py-2 text-sm font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                    >
                      {isLoadingMore ? "Loading..." : "Load more reviews"}
                    </button>
                  </div>
                )}
              </div>
            </FadeUp>

            {showBusinessResponsesSection && business ? (
              <FadeUp className="biz-responses-section-wrap">
                <BusinessProfileResponses
                  businessName={business.name}
                  entries={businessResponseEntries}
                  awaitingResponseCount={reviewsAwaitingResponseCount}
                />
              </FadeUp>
            ) : null}

            <FadeUp className="biz-about-section">
              <div className="space-y-0 text-sm">
                <div className="biz-about-block">
                  <h2 className="biz-section-title text-lg">
                    <span className="biz-section-accent">About</span>{" "}
                    {sanitizeText(business?.name ?? "Business")}
                  </h2>
                  <p className="biz-section-sub mt-3 text-sm">
                    Contact details and background information about this business.
                  </p>
                </div>
                <div className="biz-about-block">
                  <h3 className="biz-field-label">
                    Company description
                  </h3>
                  <p className="biz-field-value mt-3 whitespace-pre-wrap">
                    {business && hasMeaningfulCompanyDescription(business.description)
                      ? sanitizeText(business.description.trim())
                      : (
                        <span className="biz-field-empty">{NO_COMPANY_DESCRIPTION_COPY}</span>
                      )}
                  </p>
                </div>

                <div className="biz-about-block">
                  <h3 className="biz-field-label">
                    Address
                  </h3>
                  <p className="biz-field-value mt-3">
                    {sanitizeText(formatBusinessAddress(
                      business?.address,
                      business?.city,
                      business?.countryCode
                    )) || (
                      <span className="biz-field-empty">Not provided.</span>
                    )}
                  </p>
                </div>

                <div className="biz-about-block">
                  <h3 className="biz-field-label">
                    Contact info
                  </h3>
                  <p className="biz-section-sub mt-2 text-sm">
                    How to reach this business directly.
                  </p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="biz-field-label">Email</span>
                      {business?.email?.trim() ? (
                        <a
                          href={`mailto:${business.email.trim()}`}
                          className="biz-link-teal mt-1 block"
                        >
                          {sanitizeText(business.email.trim())}
                        </a>
                      ) : (
                        <p className="biz-field-empty mt-1">Not provided.</p>
                      )}
                    </div>
                    <div>
                      <span className="biz-field-label">Phone number</span>
                      {business?.phone?.trim() ? (
                        <a
                          href={`tel:${business.phone.trim().replace(/\s/g, "")}`}
                          className="biz-link-teal mt-1 block"
                        >
                          {sanitizeText(business.phone.trim())}
                        </a>
                      ) : (
                        <p className="biz-field-empty mt-1">Not provided.</p>
                      )}
                    </div>
                    <div>
                      <span className="biz-field-label">Website</span>
                      {business?.website?.trim() ? (
                        <a
                          href={buildWebsiteHref(business.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="biz-link-teal mt-1 inline-flex items-center gap-1"
                        >
                          {sanitizeText(business.website)}
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="M14 3h7v7" />
                            <path d="M10 14L21 3" />
                          </svg>
                        </a>
                      ) : (
                        <p className="biz-field-empty mt-1">Not provided.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>

            {business ? (
              <FadeUp className="biz-photos-section">
                <BusinessProfilePhotos
                  businessId={business.id}
                  businessWebsite={business.website}
                  businessSlug={business.slug ?? null}
                  photos={businessPhotos}
                  claimSignupPrefill={
                    !initialIsClaimed && business
                      ? {
                          businessId: business.id,
                          businessName: business.name,
                          businessSlug: business.slug || null,
                          website: business.website || null,
                        }
                      : null
                  }
                />
              </FadeUp>
            ) : null}

            {business?.slug ? (
              <FadeUp className="biz-articles-section">
                <BusinessProfileArticles
                  businessName={business.name}
                  businessSlug={business.slug}
                  articles={initialPublishedArticles}
                  categoryLabel={categoryPublicLabel || null}
                  categoryArticlesHref={categoryArticlesHref}
                />
              </FadeUp>
            ) : null}

              {business?.categorySlug?.trim() && (
                <FadeUp className="biz-rankings-section">
                <div>
                  <h2 className="biz-section-title text-lg">
                    Explore rankings for{" "}
                    {categoryPublicLabel || formatBusinessTagLabel(business.categorySlug)} in{" "}
                    {rankingsCountryName}
                  </h2>
                  <p className="biz-section-sub mt-2 max-w-3xl text-sm">
                    Compare {sanitizeText(business.name)} with other highly rated
                    businesses in the same category and country. Visitors can use these
                    rankings to discover nearby options and see how different businesses
                    perform on Tellacity.
                  </p>
                  <div className="biz-rankings-card mt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-xl font-semibold">
                            Top rated companies
                          </h4>
                          <p className="mt-1 text-xs text-white/55">
                            {categoryPublicLabel || formatBusinessTagLabel(business.categorySlug)}{" "}
                            · {rankingsCountryCode}
                          </p>
                        </div>
                        <Link
                          href={`/categories/${encodeURIComponent(
                            business.categorySlug.trim()
                          )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                          className="biz-link-teal shrink-0 text-sm font-medium hover:underline"
                        >
                          View category rankings →
                        </Link>
                      </div>

                      {topRatedInCategoryLoading ? (
                        <div
                          className={`mt-4 grid grid-cols-1 gap-3 ${
                            isPublicBusinessProfile
                              ? "sm:grid-cols-3"
                              : "sm:grid-cols-2"
                          }`}
                        >
                          {Array.from({
                            length: isPublicBusinessProfile ? 3 : 8,
                          }).map((_, i) => (
                            <div
                              key={`top-rated-sk-${i}`}
                              className="flex animate-pulse gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                            >
                              <div className="h-8 w-8 shrink-0 rounded-md bg-gray-200" />
                              <div className="min-w-0 flex-1 space-y-2 py-0.5">
                                <div className="h-4 w-3/4 rounded bg-gray-200" />
                                <div className="h-3 w-1/2 rounded bg-gray-200" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : topRatedForExploreRankings.length > 0 ? (
                        <div
                          className={`mt-4 grid grid-cols-1 gap-3 ${
                            isPublicBusinessProfile
                              ? "sm:grid-cols-3"
                              : "sm:grid-cols-2"
                          }`}
                        >
                          {topRatedForExploreRankings.map((item) => (
                            <Link
                              key={item.id}
                              href={`/b/${item.slug}`}
                              className="biz-similar-item flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:border-[#00B4A6]"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10">
                                {item.logoUrl ? (
                                  <img
                                    src={
                                      normalizeLogoUrl(item.logoUrl) ??
                                      item.logoUrl
                                    }
                                    alt={`${sanitizeText(item.name)} logo`}
                                    className="h-full w-full object-contain"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate">
                                  {sanitizeText(item.name)}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
                                  <RatingStars
                                    rating={item.trustScore}
                                    size={11}
                                  />
                                  <span className="font-medium text-white">
                                    {item.trustScore.toFixed(1)}
                                  </span>
                                  <span>
                                    ·{" "}
                                    {item.reviewCount.toLocaleString("en-US")}{" "}
                                    reviews
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-white/60">
                          <Link
                            href={`/categories/${encodeURIComponent(
                              business.categorySlug.trim()
                            )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                            className="biz-link-teal font-medium hover:underline"
                          >
                            Browse rankings on the category page
                          </Link>
                        </p>
                      )}
                  </div>
                </div>
                </FadeUp>
              )}

              {business?.categorySlug?.trim() &&
                business?.countryCode &&
                (relatedBusinessesLoading || relatedBusinesses.length > 0) && (
                  <FadeUp className="biz-similar-section">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <h3 className="biz-section-title text-lg">
                        More businesses like this
                      </h3>
                      <Link
                        href={`/categories/${encodeURIComponent(
                          business.categorySlug.trim(),
                        )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                        className="biz-link-teal shrink-0 text-sm font-medium hover:underline"
                      >
                        View full directory →
                      </Link>
                    </div>
                    <div className="biz-similar-card mt-4">
                      <div>
                          <h4 className="text-xl font-semibold text-[#0A0A0A]">
                            Same category and country
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {categoryPublicLabel ||
                              formatBusinessTagLabel(business.categorySlug)}{" "}
                            · {rankingsCountryCode}
                          </p>
                        </div>

                      {relatedBusinessesLoading ? (
                        <div
                          className={`mt-4 grid grid-cols-1 gap-3 ${
                            isPublicBusinessProfile
                              ? "sm:grid-cols-3"
                              : "sm:grid-cols-2"
                          }`}
                        >
                          {Array.from({
                            length: isPublicBusinessProfile ? 3 : 6,
                          }).map((_, i) => (
                            <div
                              key={`related-sk-${i}`}
                              className="flex animate-pulse gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                            >
                              <div className="h-8 w-8 shrink-0 rounded-md bg-gray-200" />
                              <div className="min-w-0 flex-1 space-y-2 py-0.5">
                                <div className="h-4 w-3/4 rounded bg-gray-200" />
                                <div className="h-3 w-1/2 rounded bg-gray-200" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          className={`mt-4 grid grid-cols-1 gap-3 ${
                            isPublicBusinessProfile
                              ? "sm:grid-cols-3"
                              : "sm:grid-cols-2"
                          }`}
                        >
                          {relatedForMoreLikeThis.map((item) => (
                            <Link
                              key={item.id}
                              href={`/b/${item.slug}`}
                              className="biz-similar-item flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0A0A0A] transition-colors"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-[#F5F0E8]">
                                {item.logoUrl ? (
                                  <img
                                    src={
                                      normalizeLogoUrl(item.logoUrl) ??
                                      item.logoUrl
                                    }
                                    alt={`${sanitizeText(item.name)} logo`}
                                    className="h-full w-full object-contain"
                                    referrerPolicy="no-referrer"
                                    crossOrigin="anonymous"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="truncate">
                                  {sanitizeText(item.name)}
                                </div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  <RatingStars
                                    rating={item.trustScore}
                                    size={11}
                                  />
                                  <span className="font-medium text-[#0A0A0A]">
                                    {item.trustScore.toFixed(1)}
                                  </span>
                                  <span>
                                    ·{" "}
                                    {item.reviewCount.toLocaleString("en-US")}{" "}
                                    reviews
                                  </span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  </FadeUp>
                )}

              {business?.categorySlug && (
                <div className="biz-seo-footer flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
                  <Link href="/">
                    Tellacity Home
                  </Link>
                  <span className="hidden text-white/30 sm:inline" aria-hidden>›</span>
                  <Link href="/reviews">
                    Customer Reviews
                  </Link>
                  <span className="hidden text-white/30 sm:inline" aria-hidden>›</span>
                  <Link
                    href={`/categories/${encodeURIComponent(
                      business.categorySlug.trim(),
                    )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                  >
                    See more in{" "}
                    {categoryPublicLabel || formatBusinessTagLabel(business.categorySlug)} in{" "}
                    {rankingsCountryName}
                  </Link>
                  {business.countryCode ? (
                    <>
                      <span className="hidden text-white/30 sm:inline" aria-hidden>›</span>
                      <Link
                        href={`/best/${business.countryCode.toLowerCase()}/${encodeURIComponent(
                          business.categorySlug.trim(),
                        )}`}
                        className="biz-link-highlight hover:underline sm:ml-auto"
                      >
                        See top companies in this category →
                      </Link>
                    </>
                  ) : null}
                </div>
              )}
            </div>
      </section>
      </main>
      {isTrustScoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="relative">
              <div
                className={`flex items-center justify-center ${
                  trustScoreStep === 0
                    ? "bg-[#FFF5CC]"
                    : trustScoreStep === 1
                    ? "bg-[#FDE1C8]"
                    : "bg-[#D9FAEF]"
                }`}
              >
                {trustScoreStep === 0 && (
                  <div className="h-36 w-full px-10 py-8">
                    <div className="flex items-center">
                      <div className="h-6 w-6 rounded-full bg-[#F6C400]" />
                      <div className="ml-3 h-2 flex-1 rounded-full bg-[#7A6514]" />
                    </div>
                  </div>
                )}
                {trustScoreStep === 1 && (
                  <div className="h-36 w-full px-10 py-8">
                    <div className="flex items-end justify-between gap-2">
                      {[38, 60, 28, 48, 70, 36, 30, 42, 55].map((height, index) => (
                        <div key={`bar-${index}`} className="flex flex-col items-center">
                          <div
                            className="w-6 rounded-full bg-[#B45309]"
                            style={{ height: `${height}px` }}
                          />
                          <div className="-mt-2 h-5 w-5 rounded-full bg-[#F97316]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {trustScoreStep === 2 && (
                  <div className="h-36 w-full px-10 py-8">
                    <div className="flex h-full items-center justify-center">
                      <div className="relative flex items-center">
                        <div className="h-2 w-64 rounded-full bg-[#0B3B36]" />
                        <div className="absolute left-12 top-[-26px] h-8 w-8 rounded-full bg-[#1FAF9E]" />
                        <div className="absolute left-32 top-[8px] h-0 w-0 border-l-[16px] border-r-[16px] border-t-[22px] border-l-transparent border-r-transparent border-t-[#0B3B36]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsTrustScoreOpen(false)}
                className="absolute right-4 top-3 text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 px-6 py-6 text-sm text-gray-700">
              <h3 className="text-lg font-semibold text-[#0E0E0E]">
                How is the TrustScore calculated?
              </h3>
              {trustScoreStep === 0 && (
                <p>
                  Time span · Newer, recent reviews hold more weight in the
                  TrustScore than older ones , they're a good indication of
                  current customer satisfaction.
                </p>
              )}
              {trustScoreStep === 1 && (
                <p>
                  Frequency · As recent reviews hold more weight, a TrustScore is
                  most stable when reviews come in regularly. Whether or not a
                  company asks for reviews can impact the TrustScore.
                </p>
              )}
              {trustScoreStep === 2 && (
                <p>
                  Average · To ensure all companies start off with a balanced
                  TrustScore, our weighted average includes neutral (3.5★)
                  reviews to the calculation. This has less impact as more
                  reviews come in.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setTrustScoreStep((prev) => Math.max(0, prev - 1))}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  trustScoreStep === 0
                    ? "text-gray-400"
                    : "border border-gray-300 text-gray-700"
                }`}
                disabled={trustScoreStep === 0}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (trustScoreStep >= 2) {
                    setIsTrustScoreOpen(false);
                  } else {
                    setTrustScoreStep((prev) => prev + 1);
                  }
                }}
                className="rounded-full bg-[#0E0E0E] px-5 py-2 text-sm font-semibold text-white"
              >
                {trustScoreStep >= 2 ? "Done" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

