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

      // Use canonical RPC for live category rankings and ratings.
      const { data: businessRows, error: businessError } = await supabaseBrowser.rpc(
        "get_top_businesses_for_category_global",
        {
          p_category_slug: categorySlug,
          p_country_code: selectedCountry,
          p_min_rating: null,
          p_limit: 8,
          p_offset: 0,
        }
      );

      if (!isMounted) return;

      if (businessError || !businessRows || businessRows.length === 0) {
        setCategoryName(categoryData?.name ?? "");
        setBusinesses([]);
        setIsLoading(false);
        return;
      }

      if (!isMounted) return;

      setCategoryName(categoryData?.name ?? "");
      const enriched = businessRows.slice(0, 8).map((row) => {
        const trustScore =
          typeof row.trust_score === "number" ? row.trust_score : 0;
        const reviewCount = Number(row.review_count ?? 0) || 0;
        const url =
          (row.resolved_logo_url ?? row.logo_url ?? "").toString().trim() ||
          null;

        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          website: row.website ?? "",
          website_display: row.website ?? "",
          resolved_logo_url: url,
          trust_score: trustScore,
          review_count: reviewCount,
        };
      });

      enriched.sort((a, b) => {
        if (b.trust_score !== a.trust_score)
          return b.trust_score - a.trust_score;
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
            const reviewCount = Number(business.review_count ?? 0) || 0;
            const ratingValue =
              typeof business.trust_score === "number" && business.trust_score > 0
                ? business.trust_score
                : 0;

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
                      <RatingStars
                        rating={ratingValue}
                        reviewCount={reviewCount}
                        size={12}
                      />
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
                    className="inline-flex w-full items-center justify-center rounded-full border border-black/20 bg-[#F4EFEE] px-4 py-2 text-xs font-semibold text-black shadow-sm hover:shadow-md transition-shadow"
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
