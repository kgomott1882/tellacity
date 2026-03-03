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

export default function RotatingBestCategorySection({ categorySlugs, selectedCountry: selectedCountryProp }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [categoryName, setCategoryName] = useState("");
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedCountry = selectedCountryProp ?? DEFAULT_COUNTRY;
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
    let isMounted = true;

    const fetchCategory = async () => {
      if (!categorySlug) {
        setCategoryName("");
        setBusinesses([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = supabaseBrowser();
        const { data: categoryData } = await supabase
          .from("categories")
          .select("name")
          .eq("slug", categorySlug)
          .single();

      // Best-in: 1) RPC get_top_businesses_for_category_global (uses business_review_metrics_v), 2) fallback = businesses table by category_slug.
      let businessRows = null;
      let businessError = null;
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_top_businesses_for_category_global",
        {
          p_category_slug: categorySlug,
          p_country_code: selectedCountry,
          p_min_rating: null,
          p_limit: 8,
          p_offset: 0,
        }
      );
      businessRows = rpcData;
      businessError = rpcError;

      // Fallback: when RPC fails or returns empty, fetch businesses directly by category
      if ((businessError || !businessRows || businessRows.length === 0) && isMounted) {
        const { data: directRows } = await supabase
          .from("businesses")
          .select("id, name, slug, website, website_display, logo_url")
          .eq("status", "active")
          .eq("category_slug", categorySlug)
          .limit(8);

        if (!isMounted) return;

        if (directRows && directRows.length > 0) {
          const enriched = directRows.map((row) => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            website: row.website ?? "",
            website_display: row.website_display ?? row.website ?? "",
            resolved_logo_url: (row.logo_url ?? "").toString().trim() || null,
            trust_score: 0,
            review_count: 0,
          }));
          setCategoryName(categoryData?.name ?? "");
          setBusinesses(enriched);
          return;
        }
      }

      if (!isMounted) return;

      if (businessError || !businessRows || businessRows.length === 0) {
        setCategoryName(categoryData?.name ?? "");
        setBusinesses([]);
        return;
      }

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
      } catch (_) {
        if (isMounted) {
          setCategoryName(categorySlug?.replace(/-/g, " ") ?? "");
          setBusinesses([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCategory();

    return () => {
      isMounted = false;
    };
  }, [categorySlug, selectedCountry]);

  const categoryDisplayName = categoryName || categorySlug?.replace(/-/g, " ") || "category";

  if (isLoading) {
    return (
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between">
            <div className="h-9 w-48 rounded bg-gray-200 animate-pulse" />
            <div className="h-8 w-24 rounded bg-gray-100 animate-pulse" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (businesses.length === 0 && categorySlug) {
    return (
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">Best in {categoryDisplayName}</span>
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
          <p className="mt-8 text-sm text-gray-500">
            No businesses in this category yet. Check back soon.
          </p>
        </div>
      </section>
    );
  }

  if (businesses.length === 0) {
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
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                  e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div
                    className="absolute h-64 w-64 rounded-full bg-[#2fb2a8]/20 blur-3xl"
                    style={{
                      top: "var(--mouse-y)",
                      left: "var(--mouse-x)",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
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
                <div className="mt-4 flex justify-center">
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
                    className="inline-flex w-auto items-center justify-center rounded-full bg-black px-6 py-2 text-xs font-medium text-white shadow-[0_0_0_rgba(249,115,22,0)] transition-all duration-200 hover:bg-[#111111] hover:shadow-[0_0_16px_rgba(249,115,22,0.5),0_0_32px_rgba(249,115,22,0.25)] active:scale-95"
                  >
                    Review
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
