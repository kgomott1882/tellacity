"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  normalizeLogoUrl,
  domainFromWebsite,
  getLogoDevUrl,
} from "@/lib/logo";
import RatingStars from "@/components/RatingStars";

const cleanDomain = (value) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

const DEFAULT_COUNTRY = "ZA";

export default function RotatingBestCategorySection({ categorySlugs }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const categorySlug =
    categorySlugs && categorySlugs.length > 0
      ? categorySlugs[activeIndex % categorySlugs.length]
      : "";

  async function fetchMetricsForBusinesses(businessIds) {
    let res = await supabaseBrowser
      .from("business_review_metrics_v")
      .select("business_id, review_count, average_rating")
      .in("business_id", businessIds);

    if (res.error && res.error.code === "42703") {
      res = await supabaseBrowser
        .from("business_review_metrics_v")
        .select("business_id, real_review_count, real_trust_score")
        .in("business_id", businessIds);
    }

    if (res.error) throw res.error;

    const map = new Map();
    (res.data || []).forEach((r) => {
      const reviewCount =
        Number(r.review_count ?? r.real_review_count ?? 0) || 0;
      const averageRating =
        Number(r.average_rating ?? r.real_trust_score ?? 0) || 0;
      map.set(r.business_id, {
        review_count: reviewCount,
        average_rating: averageRating,
      });
    });
    return map;
  }

  useEffect(() => {
    if (!categorySlugs || categorySlugs.length === 0) {
      return;
    }
    setActiveIndex(0);
  }, [categorySlugs]);

  useEffect(() => {
    if (!categorySlugs || categorySlugs.length === 0) {
      return;
    }
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % categorySlugs.length);
    }, 180000);
    return () => window.clearInterval(interval);
  }, [categorySlugs]);

  useEffect(() => {
    const readCountry = () => {
      if (typeof window === "undefined") return;
      const stored = window.localStorage.getItem("tellacity_country");
      setSelectedCountry(stored || DEFAULT_COUNTRY);
    };

    readCountry();

    window.addEventListener("storage", readCountry);
    window.addEventListener("tellacity-country-change", readCountry);

    return () => {
      window.removeEventListener("storage", readCountry);
      window.removeEventListener("tellacity-country-change", readCountry);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchCategory = async () => {
      if (!categorySlug) {
        setCategoryName("");
        setBusinesses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data: categoryData } = await supabaseBrowser
        .from("categories")
        .select("name")
        .eq("slug", categorySlug)
        .single();

      const { data: businessRows, error: businessError } = await supabaseBrowser
        .from("businesses")
        .select("id, slug, name, website, website_display, country_code, category_slug, logo_url")
        .eq("category_slug", categorySlug)
        .eq("country_code", selectedCountry)
        .eq("status", "active")
        .limit(8);

      if (!isMounted) return;

      if (businessError || !businessRows || businessRows.length === 0) {
        setCategoryName(categoryData?.name ?? "");
        setBusinesses([]);
        setIsLoading(false);
        return;
      }

      const businessIds = businessRows.map((b) => b.id);
      let metricsMap;
      try {
        metricsMap = await fetchMetricsForBusinesses(businessIds);
      } catch (err) {
        metricsMap = new Map();
      }

      if (!isMounted) return;

      setCategoryName(categoryData?.name ?? "");
      const enriched = businessRows.slice(0, 8).map((row) => {
        let url = (row.resolved_logo_url ?? row.logo_url ?? "").toString().trim() || null;
        const metrics = metricsMap.get(row.id) || {
          review_count: 0,
          average_rating: 0,
        };
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          website: row.website_display ?? row.website,
          resolved_logo_url: url,
          review_count: metrics.review_count,
          avg_rating: metrics.average_rating,
        };
      });

      enriched.sort((a, b) => {
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        if (b.review_count !== a.review_count) return b.review_count - a.review_count;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });

      setBusinesses(enriched);
      setIsLoading(false);
    };

    fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, selectedCountry]);

  if (isLoading || businesses.length === 0 || !categoryName) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">Best in {categoryName}</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
          <Link
            href={`/categories/${categorySlug}`}
            className="text-sm font-semibold text-[#1FAF9E]"
          >
            View all →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {businesses.map((business) => {
            const reviewCount = Number(business.review_count ?? 0);
            const averageRating = Number(business.avg_rating ?? 0);
            const ratingValue =
              averageRating != null && averageRating > 0 ? averageRating : 0;

            const logoUrl =
              normalizeLogoUrl(business.resolved_logo_url) ??
              getLogoDevUrl(domainFromWebsite(business.website_display ?? business.website));

            return (
              <Link
                key={`${business.slug ?? "business"}-${business.id ?? ""}`}
                href={`/b/${business.slug}`}
                className="flex flex-col rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FCF7F6]">
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt={business.name ?? "Business"}
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0E0E0E]">
                      {business.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {cleanDomain(business.website)}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                      <RatingStars rating={ratingValue} size={12} />
                      <span className="text-[#0E0E0E]">
                        {ratingValue.toFixed(1)}
                      </span>
                      <span className="text-gray-500">
                        {reviewCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-px w-full bg-gray-200" />
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      window.location.href = `/write-review?businessId=${encodeURIComponent(
                        business.id ?? ""
                      )}&businessName=${encodeURIComponent(
                        business.name ?? ""
                      )}&businessSlug=${encodeURIComponent(
                        business.slug ?? ""
                      )}`;
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full bg-[#EEE9E8] px-4 py-2 text-xs font-semibold text-black"
                  >
                    Review this business
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
