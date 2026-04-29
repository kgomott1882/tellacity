"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { CAROUSEL_NAV_BUTTON_CLASS } from "@/lib/carouselNavButton";
import { CarouselNavChevron } from "@/components/ui/CarouselNavChevron";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl, similarBusinessLogoUrl } from "@/lib/logo";
import {
  businessCategoryPillClassName,
  formatBusinessTagLabel,
  mergeTagsForDisplay,
} from "@/lib/businessTags";
import { formatBusinessAddress, getCountryName } from "@/lib/address";
import { normalizeCountryCode } from "@/lib/country";
import { getActiveCountry } from "@/lib/getActiveCountry";
import { sanitizeText } from "@/lib/sanitizeText";
import RatingStars from "@/components/RatingStars";
import RecentReviewCard from "@/components/reviews/RecentReviewCard";
import BusinessProfilePhotos from "@/components/business/BusinessProfilePhotos";
import type { PlanKey } from "@/lib/plans";
import type {
  BusinessPhotoPublic,
  BusinessPhotoSectionConfig,
} from "@/lib/businessPhotosDisplay";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";

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

type Review = {
  id: string;
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
  createdAtRaw: string | null;
  likeCount: number;
};

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

  const baseSlug = safeSlug.replace(/-\d+$/, "");
  if (baseSlug && baseSlug !== safeSlug) {
    const baseMatch = await fetchBySlug(baseSlug);
    if (baseMatch) return baseMatch;
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

type BusinessClientProps = {
  initialBusiness?: BusinessRow | null;
  initialBusinessPhotos?: BusinessPhotoPublic[];
  initialPhotoSections?: BusinessPhotoSectionConfig[];
  /**
   * Whether this business has a registered owner (i.e. has been claimed).
   * Derived from `businesses.owner_id` on the server and passed down so the
   * public profile can hide the "Claim this profile" teaser when not needed.
   */
  initialIsClaimed?: boolean;
  /**
   * Active billing plan for this business. Used on the public profile to
   * render empty photo-category placeholders for Free / unclaimed
   * businesses only (paid plans don't get upsold with empty cards).
   */
  initialPlanKey?: PlanKey;
};

export default function BusinessClient({
  initialBusiness = null,
  initialBusinessPhotos,
  initialPhotoSections,
  initialIsClaimed = false,
  initialPlanKey = "free",
}: BusinessClientProps) {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [business, setBusiness] = useState<Business | null>(() => {
    if (!initialBusiness || typeof initialBusiness !== "object") return null;
    const row = initialBusiness;
    const address = String(row.address ?? "").trim();
    const city = String(row.city ?? "").trim();
    const countryCode = String(row.country_code ?? "").trim();
    const email = String(row.email ?? "").trim();
    const phone = String(row.phone ?? "").trim();
    const logoUrlRaw = (String(row.logo_url ?? "").trim()) || null;
    const reviewCount = Number(row.review_count ?? 0);
    const averageRating = Number(row.average_rating ?? 0);
    return {
      id: String(row.id ?? ""),
      name: String(row.name ?? "Business"),
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
      countryCode: countryCode || (String(row.country_code ?? "")),
      address,
      city: city || (String(row.city ?? "")),
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
  });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [repliesByReviewId, setRepliesByReviewId] = useState<
    Record<string, ReviewReply[]>
  >({});
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(!initialBusiness);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reviewOffset, setReviewOffset] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
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
  const [photoSections, setPhotoSections] = useState<BusinessPhotoSectionConfig[]>(
    () => initialPhotoSections ?? []
  );
  const [duplicateNoticeOpen, setDuplicateNoticeOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return searchParams.get("reviewNotice") === "duplicate_review";
    } catch {
      return false;
    }
  });
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

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
          .select("id, url, section, created_at, is_cover, sort_order, preview_zoom, preview_x, preview_y, preview_frame")
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
          }))
      );

      if (initialPhotoSections === undefined) {
        const { data: secData } = await sb
          .from("business_photo_sections")
          .select("slug, title, is_enabled, sort_order")
          .eq("business_id", business.id)
          .eq("is_enabled", true)
          .order("sort_order", { ascending: true });
        if (!cancelled && Array.isArray(secData)) {
          setPhotoSections(
            secData
              .map((r) => ({
                slug: String((r as { slug?: string }).slug ?? ""),
                title: String((r as { title?: string }).title ?? ""),
                is_enabled: (r as { is_enabled?: boolean }).is_enabled !== false,
                sort_order: Number((r as { sort_order?: unknown }).sort_order) || 0,
              }))
              .filter((s) => s.slug && s.title)
          );
        }
      }
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

      const row = businessRow as Record<string, unknown>;
      let address = (row.address ?? "").toString().trim();
      let city = (row.city ?? "").toString().trim();
      let countryCode = (row.country_code ?? "").toString().trim();
      let email = (row.email ?? "").toString().trim();
      let phone = (row.phone ?? "").toString().trim();
      const logoUrlRaw: string | null = ((row.logo_url ?? "").toString().trim()) || null;
      const reviewCount = Number(row.review_count ?? 0);
      const averageRating = Number(row.average_rating ?? 0);

      if (!isMounted) return;

      setBusiness({
        id: row.id as string,
        name: (row.name ?? "Business") as string,
        slug: (row.slug ?? "") as string,
        website: cleanDomain(
          (row.website_display ?? row.website ?? "").toString()
        ),
        logoUrl: normalizeLogoUrl(logoUrlRaw),
        trustScore:
          row.trust_score != null ? Number(row.trust_score) : null,
        reviewCount,
        averageRating,
        rating1Count: Number(row.rating_1_count ?? 0),
        rating2Count: Number(row.rating_2_count ?? 0),
        rating3Count: Number(row.rating_3_count ?? 0),
        rating4Count: Number(row.rating_4_count ?? 0),
        rating5Count: Number(row.rating_5_count ?? 0),
        countryCode: countryCode || ((row.country_code ?? "").toString()),
        address,
        city: city || ((row.city ?? "").toString()),
        description: (row.description ?? "").toString().trim(),
        categorySlug: (row.category_slug ?? "").toString(),
        categoryGroupSlug: (row.primary_group_slug ?? null) as string | null,
        categoryGroupName: (row.primary_group_name ?? null) as string | null,
        categoryName: (row.category_name ?? null) as string | null,
        tags: mergeTagsForDisplay(
        row.tags,
        row.secondary_category_slugs,
        (row.category_slug ?? null) as string | null,
      ),
        status: (row.status ?? "active") as string,
        email,
        phone,
      });
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
      reviewIds: string[],
      replaceExisting: boolean
    ) => {
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

      if (replaceExisting) {
        setRepliesByReviewId(grouped);
      } else {
        setRepliesByReviewId((prev) => ({ ...prev, ...grouped }));
      }
    };

    const fetchReviewsPage = async (
      offset = 0,
      append = false,
      options?: { silent?: boolean }
    ) => {
      const silent = options?.silent === true;
      const sb = supabaseBrowser();
      const { data, error, count } = await sb
        .from("reviews")
        .select(
          "id, guest_name, rating, title, body, created_at, status, like_count",
          { count: "exact" }
        )
        .eq("business_id", businessId)
        .eq("status", "published")
        .in("visibility", ["visible", "landing_hidden"])
        .order("created_at", { ascending: false })
        .range(offset, offset + 4);

      if (!isMounted) {
        return;
      }

      if (!error) {
        const mapped = (data ?? []).map((review) => ({
          id: review.id,
          reviewerName: review.guest_name ?? "Anonymous",
          rating: Number(review.rating ?? 0),
          title: review.title ?? "",
          body: review.body ?? "",
          createdAt: formatDate(review.created_at),
          createdAtRaw: review.created_at ?? null,
          likeCount: Number((review as { like_count?: number }).like_count ?? 0),
        }));
        setReviews((prev) => (append ? [...prev, ...mapped] : mapped));
        const reviewIds = mapped.map((item) => item.id);
        void fetchReplies(reviewIds, !append);
        const totalCount = count ?? mapped.length;
        setTotalReviewCount(totalCount);
        setHasMoreReviews(offset + mapped.length < totalCount);
        setReviewOffset(offset + mapped.length);
      }
    };

    const loadReviewsAndStats = async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) {
        setReviews([]);
        setRepliesByReviewId({});
        setReviewOffset(0);
        setHasMoreReviews(false);
        setIsLoadingReviews(true);
      }
      await fetchReviewStats();
      await fetchReviewsPage(0, false, { silent });
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

    if (business.trustScore != null && business.trustScore > 0) {
      return business.trustScore;
    }

    if (business.averageRating > 0) {
      return business.averageRating;
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

    return 0;
  }, [business, reviewStats, ratingCounts, reviews]);

  const derivedReviewCount = useMemo(() => {
    if (reviewStats) {
      return reviewStats.total;
    }
    if (!isLoadingReviews && totalReviewCount > 0) {
      return totalReviewCount;
    }
    if (business?.reviewCount && business.reviewCount > 0) {
      return business.reviewCount;
    }
    if (totalReviewCount > 0) {
      return totalReviewCount;
    }
    return reviews.length;
  }, [
    reviewStats,
    isLoadingReviews,
    totalReviewCount,
    business?.reviewCount,
    reviews.length,
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

  const rankingsCountryCode =
    (business?.countryCode || "US").trim().toUpperCase() || "US";

  const businessLogoUrl = similarBusinessLogoUrl({
    resolved_logo_url: business?.logoUrl,
    logo_url: null,
    website: business?.website,
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
      <main className="bg-white">
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
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <nav className="text-xs text-gray-500">
          <Link href="/categories" className="hover:text-[#1FAF9E]">
            Categories
          </Link>
          {categoryTrail?.groupName && categoryTrail?.groupSlug && (
            <>
              <span className="mx-2">›</span>
              <Link
                href={`/categories/${categoryTrail.groupSlug}`}
                className="hover:text-[#1FAF9E]"
              >
                {sanitizeText(categoryTrail.groupName)}
              </Link>
            </>
          )}
          {categoryTrail?.categoryName && categoryTrail?.categorySlug && (
            <>
              <span className="mx-2">›</span>
              <Link
                href={`/categories/${categoryTrail.categorySlug}`}
                className="hover:text-[#1FAF9E]"
              >
                {sanitizeText(categoryTrail.categoryName)}
              </Link>
            </>
          )}
          <span className="mx-2">›</span>
          <span className="text-gray-700">{sanitizeText(business?.name ?? "Business")}</span>
        </nav>

        <div className="mt-6 flex flex-col gap-6 border-b border-gray-200 pb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#FCF7F6]">
              {(() => {
                const displayLogo = businessLogoUrl;
                return displayLogo ? (
                  <img
                    key={displayLogo}
                    src={normalizeLogoUrl(displayLogo) ?? displayLogo}
                    alt={`${business?.name ?? "Business"} logo`}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null;
              })()}
            </div>
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
                    <h1 className="text-3xl font-semibold text-[#0E0E0E]">
                      {sanitizeText(business?.name ?? "")} Reviews
                    </h1>
                    {derivedReviewCount > 0 && (
                      <img
                        src="/brand/Tellacity%20Vefication%20Batch.png"
                        alt="Tellacity verified reviews"
                        className="h-5 w-5 shrink-0"
                      />
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <span>
                      Reviews {derivedReviewCount.toLocaleString()}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <RatingStars rating={derivedAverageRating} size={14} />
                      <span className="font-semibold text-[#0E0E0E]">
                        {derivedAverageRating.toFixed(1)}
                      </span>
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#2563EB] text-[10px] text-[#2563EB]">
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
                    return (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={businessCategoryPillClassName()}>
                          {primaryLabel}
                        </span>
                      </div>
                    );
                  })()}
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
                  className="inline-flex items-center gap-2 rounded-full bg-[#1FAF9E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
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
                    className="inline-flex items-center gap-2 rounded-full border border-[#2563EB] px-5 py-2 text-sm font-semibold text-[#2563EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30"
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
          {business && (
            <p className="mt-4 mb-6 max-w-2xl text-sm text-gray-600">
              Tellacity collects verified customer reviews to help people make informed decisions. Read real {sanitizeText(business.name)} reviews or share your experience.
            </p>
          )}
        </div>

        <div className="mt-10 space-y-10">
          <div>
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-[#0E0E0E]">
                  Review summary
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                  {business?.description ||
                    "Reviews are written by real customers and moderated for authenticity."}
                </p>

                <div className="mt-8 rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-4xl font-semibold text-[#0E0E0E]">
                        {business ? derivedAverageRating.toFixed(1) : "0.0"}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[#0E0E0E]">
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
                        <RatingStars rating={derivedAverageRating} size={16} />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {derivedReviewCount.toLocaleString()} reviews
                      </p>
                    </div>
                    <div className="w-full max-w-sm space-y-2 text-xs text-gray-500">
                      {[
                        { label: "5-star", count: ratingCounts[5] ?? 0, color: "bg-[#1FAF9E]" },
                        { label: "4-star", count: ratingCounts[4] ?? 0, color: "bg-[#78C850]" },
                        { label: "3-star", count: ratingCounts[3] ?? 0, color: "bg-[#F4C542]" },
                        { label: "2-star", count: ratingCounts[2] ?? 0, color: "bg-[#F59E0B]" },
                        { label: "1-star", count: ratingCounts[1] ?? 0, color: "bg-[#EF4444]" },
                      ].map((row) => {
                        const total =
                          ratingCounts.total ||
                          derivedReviewCount ||
                          1;
                        return (
                          <div key={row.label} className="flex items-center gap-3">
                            <span className="w-12 text-right text-gray-600">
                              {row.label}
                            </span>
                            <div className="h-2 flex-1 rounded-full bg-gray-100">
                              <div
                                className={`h-2 rounded-full ${row.color}`}
                                style={{
                                  width: `${Math.round((row.count / total) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-4 text-sm text-gray-600">
                    <button
                      type="button"
                      onClick={() => {
                        setTrustScoreStep(0);
                        setIsTrustScoreOpen(true);
                      }}
                      className="inline-flex items-center gap-2 text-[#0E0E0E] underline underline-offset-4 hover:text-[#1FAF9E]"
                    >
                      How is the TrustScore calculated?
                    </button>
                  </div>
                </div>
              </div>

              {business ? (
                <div className="mt-10">
                  <BusinessProfilePhotos
                    photos={businessPhotos}
                    sections={photoSections}
                    isClaimed={initialIsClaimed}
                    planKey={initialPlanKey}
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
                </div>
              ) : null}

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#0E0E0E]">
                  Customer reviews of {sanitizeText(business?.name ?? "Business")}
                </h2>
                <span className="text-xs text-gray-500">
                  {derivedReviewCount.toLocaleString()} total
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Read real experiences from customers who have interacted with {sanitizeText(business?.name ?? "this business")}.
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
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      aria-label="Scroll reviews left"
                      onClick={scrollReviewsRowLeft}
                      style={{
                        position: "absolute",
                        left: "-10px",
                        top: "40%",
                        zIndex: 10,
                        pointerEvents: "auto",
                      }}
                      className={`${CAROUSEL_NAV_BUTTON_CLASS} opacity-90 transition-opacity hover:opacity-100`}
                    >
                      <CarouselNavChevron dir="left" />
                    </button>
                    <div
                      ref={scrollContainerRef}
                      style={{
                        display: "flex",
                        overflowX: "auto",
                        gap: "16px",
                        scrollBehavior: "smooth",
                        padding: "0 40px",
                      }}
                    >
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="w-[min(85vw,380px)] shrink-0 self-stretch"
                        >
                          <RecentReviewCard
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
                      style={{
                        position: "absolute",
                        right: "-10px",
                        top: "40%",
                        zIndex: 10,
                        pointerEvents: "auto",
                      }}
                      className={`${CAROUSEL_NAV_BUTTON_CLASS} opacity-90 transition-opacity hover:opacity-100`}
                    >
                      <CarouselNavChevron dir="right" />
                    </button>
                  </div>
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

                        const sb = supabaseBrowser();
                        const { data, error, count } = await sb
                          .from("reviews")
                          .select(
                            "id, guest_name, rating, title, body, created_at, status, like_count",
                            { count: "exact" }
                          )
                          .eq("business_id", business.id)
                          .eq("status", "published")
                          .in("visibility", ["visible", "landing_hidden"])
                          .order("created_at", { ascending: false })
                          .range(offset, offset + 4);

                        if (!error) {
                          const mapped = (data ?? []).map((review) => ({
                            id: review.id,
                            reviewerName: review.guest_name ?? "Anonymous",
                            rating: Number(review.rating ?? 0),
                            title: review.title ?? "",
                            body: review.body ?? "",
                            createdAt: formatDate(review.created_at),
                            createdAtRaw: review.created_at ?? null,
                            likeCount: Number(
                              (review as { like_count?: number }).like_count ?? 0
                            ),
                          }));
                          setReviews((prevReviews) => [
                            ...prevReviews,
                            ...mapped,
                          ]);
                          const reviewIds = mapped.map((item) => item.id);
                          if (reviewIds.length > 0) {
                            const { data: replyData } = await sb
                              .from("review_replies")
                              .select(
                                "id, review_id, body, created_at, author_role"
                              )
                              .in("review_id", reviewIds)
                              .eq("author_role", "business")
                              .order("created_at", { ascending: true });

                            if (replyData) {
                              const grouped =
                                replyData.reduce<Record<string, ReviewReply[]>>(
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
                              setRepliesByReviewId((prev) => ({
                                ...prev,
                                ...grouped,
                              }));
                            }
                          }
                          const totalCount = count ?? mapped.length;
                          setHasMoreReviews(
                            offset + mapped.length < totalCount
                          );
                          setReviewOffset(offset + mapped.length);
                        }

                        setIsLoadingMore(false);
                      }}
                      className="rounded-full border border-[#1FAF9E] px-6 py-2 text-sm font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                    >
                      {isLoadingMore ? "Loading..." : "Load more reviews"}
                    </button>
                  </div>
                )}
              </div>
            </div>

              <div className="mt-10 space-y-6 text-sm text-gray-600">
                {/* Company description - same as Profile page; fallback to category when empty */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    Company description
                  </h3>
                  <p className="mt-3 whitespace-pre-wrap">
                    {sanitizeText(business?.description?.trim()) ||
                      (categoryTrail?.categoryName || categoryTrail?.groupName
                        ? `This business is in the ${sanitizeText(categoryTrail?.categoryName ?? categoryTrail?.groupName)} category.`
                        : "No description provided.")}
                  </p>
                </div>

                {/* Address - full address + country name, else city + country name, else country name (never code) */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    Address
                  </h3>
                  <p className="mt-3">
                    {sanitizeText(formatBusinessAddress(
                      business?.address,
                      business?.city,
                      business?.countryCode
                    )) || "Not provided."}
                  </p>
                </div>

                {/* Contact info - Email and Phone as separate fields, same as Profile page */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    Contact info
                  </h3>
                  <p className="mt-2 text-gray-500">Tell your customers how to get in touch.</p>
                  <div className="mt-4 space-y-4">
                    <div>
                      <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Email</span>
                      {business?.email?.trim() ? (
                        <a
                          href={`mailto:${business.email.trim()}`}
                          className="mt-1 block text-[#1FAF9E] hover:underline"
                        >
                          {sanitizeText(business.email.trim())}
                        </a>
                      ) : (
                        <p className="mt-1 text-gray-500">Not provided.</p>
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Phone number</span>
                      {business?.phone?.trim() ? (
                        <a
                          href={`tel:${business.phone.trim().replace(/\s/g, "")}`}
                          className="mt-1 block text-[#1FAF9E] hover:underline"
                        >
                          {sanitizeText(business.phone.trim())}
                        </a>
                      ) : (
                        <p className="mt-1 text-gray-500">Not provided.</p>
                      )}
                    </div>
                    <div>
                      <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Website</span>
                      {business?.website?.trim() ? (
                        <a
                          href={buildWebsiteHref(business.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-[#1FAF9E] hover:underline"
                        >
                          {sanitizeText(business.website)}
                        </a>
                      ) : (
                        <p className="mt-1 text-gray-500">Not provided.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {business?.categorySlug?.trim() && (
                <div className="mt-10">
                  <h3 className="text-lg font-semibold text-[#0E0E0E]">
                    Explore Rankings
                  </h3>
                  <div className="mt-4 rounded-2xl border-2 border-[#1FAF9E]/45 bg-white p-5 shadow-[0_12px_36px_-14px_rgba(31,175,158,0.7)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-xl font-semibold text-[#0E0E0E]">
                            Top rated companies
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {categoryPublicLabel || formatBusinessTagLabel(business.categorySlug)}{" "}
                            · {rankingsCountryCode}
                          </p>
                        </div>
                        <Link
                          href={`/categories/${encodeURIComponent(
                            business.categorySlug.trim()
                          )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                          className="shrink-0 text-sm font-medium text-[#1FAF9E] hover:underline"
                        >
                          View category rankings →
                        </Link>
                      </div>

                      {topRatedInCategoryLoading ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {Array.from({ length: 8 }).map((_, i) => (
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
                      ) : topRatedInCategory.length > 0 ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {topRatedInCategory.map((item) => (
                            <Link
                              key={item.id}
                              href={`/b/${item.slug}`}
                              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0E0E0E] transition-colors hover:border-[#1FAF9E] hover:bg-[#F8FFFE]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#EDEDED] bg-[#FCF7F6]">
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
                                  <span className="font-medium text-[#0E0E0E]">
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
                        <p className="mt-4 text-sm text-gray-500">
                          <Link
                            href={`/categories/${encodeURIComponent(
                              business.categorySlug.trim()
                            )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                            className="font-medium text-[#1FAF9E] hover:underline"
                          >
                            Browse rankings on the category page
                          </Link>
                        </p>
                      )}
                  </div>
                </div>
              )}

              {business?.categorySlug?.trim() &&
                business?.countryCode &&
                (relatedBusinessesLoading || relatedBusinesses.length > 0) && (
                  <div className="mt-10">
                    <h3 className="text-lg font-semibold text-[#0E0E0E]">
                      More businesses like this
                    </h3>
                    <div className="mt-4 rounded-2xl border-2 border-[#1FAF9E]/45 bg-white p-5 shadow-[0_12px_36px_-14px_rgba(31,175,158,0.7)]">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-xl font-semibold text-[#0E0E0E]">
                            Same category and country
                          </h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {categoryPublicLabel ||
                              formatBusinessTagLabel(business.categorySlug)}{" "}
                            · {rankingsCountryCode}
                          </p>
                        </div>
                        <Link
                          href={`/categories/${encodeURIComponent(
                            business.categorySlug.trim(),
                          )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                          className="shrink-0 text-sm font-medium text-[#1FAF9E] hover:underline"
                        >
                          View full directory →
                        </Link>
                      </div>

                      {relatedBusinessesLoading ? (
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {Array.from({ length: 6 }).map((_, i) => (
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
                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {relatedBusinesses.map((item) => (
                            <Link
                              key={item.id}
                              href={`/b/${item.slug}`}
                              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0E0E0E] transition-colors hover:border-[#1FAF9E] hover:bg-[#F8FFFE]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#EDEDED] bg-[#FCF7F6]">
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
                                  <span className="font-medium text-[#0E0E0E]">
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
                )}

              {business?.categorySlug && (
                <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                  <Link href="/" className="text-gray-600 hover:text-[#0E0E0E]">
                    Tellacity Home
                  </Link>
                  <Link href="/reviews" className="text-gray-600 hover:text-[#0E0E0E]">
                    Customer Reviews
                  </Link>
                  <Link
                    href={`/categories/${encodeURIComponent(
                      business.categorySlug.trim(),
                    )}?country=${encodeURIComponent(rankingsCountryCode)}`}
                    className="text-gray-600 hover:text-[#0E0E0E]"
                  >
                    More in {categoryPublicLabel || formatBusinessTagLabel(business.categorySlug)}
                  </Link>
                  {business.countryCode ? (
                    <Link
                      href={`/best/${business.countryCode.toLowerCase()}/${encodeURIComponent(
                        business.categorySlug.trim(),
                      )}`}
                      className="font-medium text-[#1FAF9E] hover:underline sm:ml-auto"
                    >
                      See top companies in this category →
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
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

