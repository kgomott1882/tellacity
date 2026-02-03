"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  normalizeLogoUrl,
  resolveBusinessLogoViaClient,
  domainFromWebsite,
  getLogoDevUrl,
} from "@/lib/logo";
import { formatBusinessAddress, getCountryName } from "@/lib/address";
import RatingStars from "@/components/RatingStars";
import RecentReviewCard from "@/components/reviews/RecentReviewCard";

type Business = {
  id: string;
  name: string;
  slug: string;
  website: string;
  /** Resolved logo: manual first, else from resolve-business-logo edge function. */
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

type SimilarBusiness = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  averageRating: number;
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

export default function BusinessProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [repliesByReviewId, setRepliesByReviewId] = useState<
    Record<string, ReviewReply[]>
  >({});
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
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
  const [similarBusinesses, setSimilarBusinesses] = useState<SimilarBusiness[]>(
    []
  );
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  useEffect(() => {
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

      let data: unknown = null;
      let error: { message: string } | null = null;
      try {
        const result = await supabase.rpc("get_business_by_slug", {
          p_slug: slug,
        });
        data = result.data;
        error = result.error;
      } catch (err) {
        error = { message: err instanceof Error ? err.message : "Failed to load business" };
      }

      if (!isMounted) return;

      const businessRow = Array.isArray(data) ? data[0] : data;

      if (error || !businessRow || typeof businessRow !== "object") {
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
      let resolvedLogoUrl: string | null = (row.resolved_logo_url ?? "").toString().trim() || null;

      try {
        const { data: contactRow } = await supabase
          .from("businesses")
          .select("address, city, country_code, email, phone, logo_url")
          .eq("slug", slug)
          .eq("status", "active")
          .maybeSingle();
        if (!isMounted) return;
        if (contactRow && typeof contactRow === "object") {
          const r = contactRow as Record<string, unknown>;
          address = (r.address ?? "").toString().trim() || address;
          city = (r.city ?? "").toString().trim() || city;
          countryCode = (r.country_code ?? "").toString().trim() || countryCode;
          email = (r.email ?? "").toString().trim() || email;
          phone = (r.phone ?? "").toString().trim() || phone;
          const directLogo = (r.logo_url ?? "").toString().trim();
          if (directLogo) resolvedLogoUrl = directLogo;
        }
      } catch {
        // businesses table query failed; use RPC data only
      }

      if (!resolvedLogoUrl) {
        try {
          const websiteRaw = (row.website_display ?? row.website ?? "").toString().trim();
          const domain = domainFromWebsite(websiteRaw || undefined);
          if (domain) {
            const fromEdge = await resolveBusinessLogoViaClient(supabase, domain);
            if (fromEdge) resolvedLogoUrl = fromEdge;
          }
        } catch {
          // Edge function failed; skip
        }
      }

      if (!isMounted) return;

      setBusiness({
        id: row.id as string,
        name: (row.name ?? "Business") as string,
        slug: (row.slug ?? "") as string,
        website: cleanDomain(
          (row.website_display ?? row.website ?? "").toString()
        ),
        logoUrl: normalizeLogoUrl(resolvedLogoUrl),
        trustScore:
          row.trust_score != null ? Number(row.trust_score) : null,
        reviewCount: Number(row.review_count ?? 0),
        averageRating: Number(row.average_rating ?? 0),
        rating1Count: Number(row.rating_1_count ?? 0),
        rating2Count: Number(row.rating_2_count ?? 0),
        rating3Count: Number(row.rating_3_count ?? 0),
        rating4Count: Number(row.rating_4_count ?? 0),
        rating5Count: Number(row.rating_5_count ?? 0),
        countryCode: countryCode || (row.country_code ?? "").toString(),
        address,
        city: city || (row.city ?? "").toString(),
        description: (row.description ?? "").toString().trim(),
        categorySlug: (row.category_slug ?? "").toString(),
        categoryGroupSlug: (row.primary_group_slug ?? null) as string | null,
        categoryGroupName: (row.primary_group_name ?? null) as string | null,
        categoryName: (row.category_name ?? null) as string | null,
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

    const pageTitle = `${business.name} Reviews | Tellacity`;
    const description = `Read customer reviews for ${business.name}. See ratings, trust score, and recent feedback on Tellacity.`;

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

      const { data } = await supabase
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
    let isMounted = true;

    const fetchSimilar = async () => {
      if (!business?.categorySlug || !business?.id) {
        setSimilarBusinesses([]);
        return;
      }

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, logo_url, website_display, website, average_rating, review_count"
        )
        .eq("category_slug", business.categorySlug)
        .neq("id", business.id)
        .eq("status", "active")
        .order("trust_score", { ascending: false, nullsFirst: false })
        .limit(4);

      if (!isMounted || error) {
        return;
      }

      const mapped = (data ?? []).map((item) => ({
        id: item.id,
        name: item.name ?? "Business",
        slug: item.slug ?? "",
        logoUrl: normalizeLogoUrl(item.logo_url ?? null),
        averageRating: Number(item.average_rating ?? 0),
        reviewCount: Number(item.review_count ?? 0),
      }));

      setSimilarBusinesses(mapped);
    };

    fetchSimilar();

    return () => {
      isMounted = false;
    };
  }, [business?.categorySlug, business?.id]);

  useEffect(() => {
    let isMounted = true;

    const fetchReviewStats = async () => {
      if (!business?.id) {
        setReviewStats(null);
        return;
      }

      const { data, error, count } = await supabase
        .from("reviews")
        .select("rating", { count: "exact" })
        .eq("business_id", business.id)
        .eq("status", "published");

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

    fetchReviewStats();

    return () => {
      isMounted = false;
    };
  }, [business?.id]);

  useEffect(() => {
    let isMounted = true;

    const fetchReplies = async (reviewIds: string[]) => {
      if (reviewIds.length === 0) {
        return;
      }

      const { data, error } = await supabase
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

      setRepliesByReviewId((prev) => ({ ...prev, ...grouped }));
    };

    const fetchReviewsPage = async (
      businessId: string,
      offset = 0,
      append = false
    ) => {
      const { data, error, count } = await supabase
        .from("reviews")
        .select("id, guest_name, rating, title, body, created_at, status", {
          count: "exact",
        })
        .eq("business_id", businessId)
        .eq("status", "published")
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
        }));
        setReviews((prev) => (append ? [...prev, ...mapped] : mapped));
        const reviewIds = mapped.map((item) => item.id);
        fetchReplies(reviewIds);
        const totalCount = count ?? mapped.length;
        setTotalReviewCount(totalCount);
        setHasMoreReviews(offset + mapped.length < totalCount);
        setReviewOffset(offset + mapped.length);
        return;
      }
    };

    if (business?.id) {
      setReviews([]);
      setRepliesByReviewId({});
      setReviewOffset(0);
      setHasMoreReviews(false);
      setIsLoadingReviews(true);
      fetchReviewsPage(business.id, 0, false).finally(() => {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      });
    }

    return () => {
      isMounted = false;
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

  if (business && business.status !== "active") {
    return (
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            {business.name}
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            This business is not available.
          </p>
        </section>
      </main>
    );
  }

  const businessJsonLd =
    business && business.status === "active"
      ? {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: business.name,
          ...(siteUrl && business.slug
            ? { url: `${siteUrl}/b/${business.slug}` }
            : {}),
          ...(business.logoUrl ? { image: business.logoUrl } : {}),
          ...(business.city || business.countryCode
            ? {
                address: {
                  "@type": "PostalAddress",
                  ...(business.city ? { addressLocality: business.city } : {}),
                  ...(business.countryCode
                    ? { addressCountry: getCountryName(business.countryCode) }
                    : {}),
                },
              }
            : {}),
          ...(derivedReviewCount > 0 && derivedAverageRating > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: derivedAverageRating,
                  reviewCount: derivedReviewCount,
                },
              }
            : {}),
          ...(business.categoryName
            ? { category: business.categoryName }
            : {}),
        }
      : null;

  return (
    <>
      {businessJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(businessJsonLd),
          }}
        />
      )}
      <main className="bg-white">
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
                {categoryTrail.groupName}
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
                {categoryTrail.categoryName}
              </Link>
            </>
          )}
          <span className="mx-2">›</span>
          <span className="text-gray-700">{business?.name ?? "Business"}</span>
        </nav>

        <div className="mt-6 flex flex-col gap-6 border-b border-gray-200 pb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#FCF7F6]">
              {(() => {
                const displayLogo = business?.logoUrl ?? (business?.website ? getLogoDevUrl(business.website) : null);
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
                  <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E]">
                    {business?.name ?? ""}
                  </h1>
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
                  {(categoryTrail?.categoryName || categoryTrail?.groupName) && (
                    <p className="mt-2 text-sm text-[#2563EB]">
                      {categoryTrail?.categoryName ?? categoryTrail?.groupName}
                    </p>
                  )}
                </>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/write-review/${business?.slug ?? ""}`}
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
              Tellacity reviews for {business.name}. Read real customer experiences, ratings, and feedback about{" "}
              {business.name}. Share your experience and help others make informed decisions.
              {categoryTrail?.categoryName && (
                <> {business.name} is listed under {categoryTrail.categoryName} on Tellacity.</>
              )}
            </p>
          )}
        </div>

        <div className="mt-10 space-y-10">
          <div>
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

            <div className="mt-10 space-y-6 text-sm text-gray-600">
              {/* Company description – same as Profile page; fallback to category when empty */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Company description
                </h3>
                <p className="mt-3 whitespace-pre-wrap">
                  {business?.description?.trim() ||
                    (categoryTrail?.categoryName || categoryTrail?.groupName
                      ? `This business is in the ${categoryTrail?.categoryName ?? categoryTrail?.groupName} category.`
                      : "No description provided.")}
                </p>
              </div>

              {/* Address – full address + country name, else city + country name, else country name (never code) */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Address
                </h3>
                <p className="mt-3">
                  {formatBusinessAddress(
                    business?.address,
                    business?.city,
                    business?.countryCode
                  ) || "Not provided."}
                </p>
              </div>

              {/* Contact info – Email and Phone as separate fields, same as Profile page */}
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
                        {business.email.trim()}
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
                        {business.phone.trim()}
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
                        {business.website}
                      </a>
                    ) : (
                      <p className="mt-1 text-gray-500">Not provided.</p>
                    )}
                  </div>
                </div>
              </div>

              {similarBusinesses.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    People also looked at
                  </h3>
                  <div className="mt-4 space-y-3">
                    {similarBusinesses.map((item) => (
                      <Link
                        key={item.id}
                        href={`/b/${item.slug}`}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:border-[#1FAF9E]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#FCF7F6]">
                          {item.logoUrl ? (
                            <img
                              src={normalizeLogoUrl(item.logoUrl) ?? item.logoUrl}
                              alt={`${item.name} logo`}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0E0E0E]">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <RatingStars rating={item.averageRating} size={10} />
                            <span>
                              {item.averageRating.toFixed(1)} •{" "}
                              {item.reviewCount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#0E0E0E]">
                  All reviews
                </h3>
                <span className="text-xs text-gray-500">
                  {derivedReviewCount.toLocaleString()} total
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Reviews are written by customers and moderated for authenticity.
              </p>
              <div className="mt-4 space-y-4">
                {isLoadingReviews &&
                  reviewSkeletons.map((_, index) => (
                    <div
                      key={`review-skeleton-${index}`}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="h-4 w-40 rounded bg-gray-100" />
                      <div className="mt-3 h-3 w-full rounded bg-gray-100" />
                      <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                    </div>
                  ))}

                {!isLoadingReviews && reviews.length === 0 && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">
                      This business has no published reviews yet.
                    </p>
                    <Link
                      href={`/write-review/${business?.slug ?? ""}`}
                      className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                    >
                      Be the first to write a review
                    </Link>
                  </div>
                )}

                {!isLoadingReviews && reviews.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {reviews.map((review) => (
                      <RecentReviewCard
                        key={review.id}
                        review={{
                          review_id: review.id,
                          rating: review.rating,
                          title: review.title,
                          body: review.body,
                          reviewer_name: review.reviewerName,
                          created_at: review.createdAtRaw ?? undefined,
                          business_name: business?.name ?? "Business",
                          business_slug: business?.slug ?? null,
                          website: business?.website ?? "",
                          resolved_logo_url: business?.logoUrl ?? null,
                        }}
                      />
                    ))}
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

                        const { data, error, count } = await supabase
                          .from("reviews")
                          .select(
                            "id, guest_name, rating, title, body, created_at, status",
                            { count: "exact" }
                          )
                          .eq("business_id", business.id)
                          .eq("status", "published")
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
                          }));
                          setReviews((prevReviews) => [
                            ...prevReviews,
                            ...mapped,
                          ]);
                          const reviewIds = mapped.map((item) => item.id);
                          if (reviewIds.length > 0) {
                            const { data: replyData } = await supabase
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
                      {isLoadingMore ? "Loading…" : "Load more reviews"}
                    </button>
                  </div>
                )}
              </div>
            </div>
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
                  TrustScore than older ones — they’re a good indication of
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
