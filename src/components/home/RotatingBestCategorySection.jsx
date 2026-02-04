"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  normalizeLogoUrl,
  resolveBusinessLogoViaClient,
  domainFromWebsite,
  getLogoDevUrl,
} from "@/lib/logo";
import RatingStars from "@/components/RatingStars";

const cleanDomain = (value) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

export default function RotatingBestCategorySection({ categorySlugs }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const COUNTRY_STORAGE_KEY = "tellacity_country";
  const categorySlug =
    categorySlugs && categorySlugs.length > 0
      ? categorySlugs[activeIndex % categorySlugs.length]
      : "";

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
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem(COUNTRY_STORAGE_KEY)
        : null;
    if (stored) {
      setSelectedCountry(stored);
    }

    const handleSync = () => {
      const updated = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
      setSelectedCountry(updated || null);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("tellacity-country-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("tellacity-country-change", handleSync);
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

      // 1) Load top businesses for this category from the businesses table
      let query = supabaseBrowser
        .from("businesses")
        .select(
          "id, slug, name, website, website_display, country_code, category_slug, resolved_logo_url:logo_url"
        )
        .eq("category_slug", categorySlug)
        .limit(8);

      if (selectedCountry) {
        query = query.eq("country_code", selectedCountry);
      }

      const { data: businessRows, error: businessError } = await query;

      if (!isMounted) {
        return;
      }

      if (businessError || !businessRows || businessRows.length === 0) {
        setCategoryName("");
        setBusinesses([]);
        setIsLoading(false);
        return;
      }

      // 2) Load ratings for just these businesses from reviews and compute
      //    truthful average rating and review counts.
      const businessIds = businessRows.map((b) => b.id).filter(Boolean);
      const ratingsById = new Map();

      if (businessIds.length > 0) {
        const { data: reviewRows, error: reviewError } = await supabaseBrowser
          .from("reviews")
          .select("business_id, rating, status")
          .in("business_id", businessIds);

        if (!reviewError && reviewRows) {
          for (const row of reviewRows) {
            if (row.status && row.status !== "published") continue;
            const rating =
              typeof row.rating === "number" ? row.rating : Number(row.rating ?? 0);
            if (!Number.isFinite(rating) || rating <= 0) continue;
            const existing = ratingsById.get(row.business_id) || {
              sum: 0,
              count: 0,
            };
            existing.sum += rating;
            existing.count += 1;
            ratingsById.set(row.business_id, existing);
          }
        }
      }

      setCategoryName(categoryData?.name ?? "");
      // Sort businesses so those with the strongest review signal appear first:
      // higher average rating first, then higher review count, then name.
      const sortedBusinesses = [...businessRows].sort((a, b) => {
        const ra = ratingsById.get(a.id) || { sum: 0, count: 0 };
        const rb = ratingsById.get(b.id) || { sum: 0, count: 0 };
        const avgA = ra.count > 0 ? ra.sum / ra.count : 0;
        const avgB = rb.count > 0 ? rb.sum / rb.count : 0;

        if (avgB !== avgA) {
          return avgB - avgA; // highest average rating first
        }
        if (rb.count !== ra.count) {
          return rb.count - ra.count; // then highest review count
        }
        return (a.name || "").localeCompare(b.name || ""); // stable fallback
      });

      // Logo: primary from businesses table (manual), secondary = edge function resolve-business-logo
      let enriched = sortedBusinesses;
      try {
        enriched = await Promise.all(
          sortedBusinesses.map(async (row) => {
            const ratingAgg = ratingsById.get(row.id) || { sum: 0, count: 0 };
            const avg =
              ratingAgg.count > 0 ? ratingAgg.sum / ratingAgg.count : 0;
            const reviewCount = ratingAgg.count;

            let url = (row.resolved_logo_url ?? "").toString().trim() || null;
            if (!url) {
              const domain = domainFromWebsite(row.website_display ?? row.website);
              if (domain) {
                const fromEdge = await resolveBusinessLogoViaClient(supabaseBrowser, domain);
                if (fromEdge) url = fromEdge;
              }
            }
            return {
              ...row,
              resolved_logo_url: url,
              avg_rating: avg,
              review_count: reviewCount,
            };
          })
        );
      } catch {
        // Enrichment failed; use base business data only
      }
      if (!isMounted) return;
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
            const averageRating =
              typeof business.avg_rating === "number"
                ? business.avg_rating
                : 0;
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
                  <span className="inline-flex w-full items-center justify-center rounded-full bg-[#EEE9E8] px-4 py-2 text-xs font-semibold text-black">
                    Review this business
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
