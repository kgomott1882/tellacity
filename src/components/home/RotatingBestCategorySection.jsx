import { useRef } from "react";
import Link from "next/link";
import { similarBusinessLogoUrl } from "@/lib/logo";
import RatingStars from "@/components/RatingStars";

const cleanDomain = (value) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

export default function RotatingBestCategorySection({
  categorySlug,
  categoryLabel,
  businesses,
  onPrevious,
  onNext,
  countryCode,
  /** True while best-in data for the active slug is not yet available (e.g. country switch). */
  isLoading = false,
}) {
  const hasBusinesses = Array.isArray(businesses) && businesses.length > 0;
  const cardsScrollRef = useRef(null);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-12 md:py-14">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
            <span className="relative inline-block">
              <span className="relative inline-block">
                <span className="relative z-10">Best</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
              {" "}in {categoryLabel}
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPrevious?.()}
              aria-label="Previous Best in category"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onNext?.()}
              aria-label="Next Best in category"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <Link
              href={
                countryCode
                  ? `/categories/${categorySlug}?country=${encodeURIComponent(
                      countryCode,
                    )}`
                  : `/categories/${categorySlug}`
              }
              className="rounded-full border border-[#1FAF9E] px-2.5 py-1 text-[10px] font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              More
            </Link>
          </div>
        </div>

        {!hasBusinesses && isLoading && (
          <p className="mt-6 text-sm text-gray-500">Loading ranked businesses…</p>
        )}
        {!hasBusinesses && !isLoading && (
          <p className="mt-6 text-sm text-gray-500">
            No businesses found yet.
          </p>
        )}

        {hasBusinesses && (
          <>
            {/* Mobile: horizontal swipe carousel */}
            <div
              ref={cardsScrollRef}
              className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {businesses.map((business) => {
                const reviewCount =
                  Number(business.review_count ?? 0) || 0;
                const ratingValue =
                  Number(business.trust_score ?? 0) || 0;
                const logoUrl = similarBusinessLogoUrl({
                  resolved_logo_url: business.resolved_logo_url,
                  logo_url: business.logo_url,
                  website: business.website,
                });

                return (
                  <Link
                    key={`${business.slug ?? "business"}-${business.id ?? ""}-mobile`}
                    href={`/b/${business.slug}`}
                    className="group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#FCF7F6]">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={business.name ?? "Business"}
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-sm font-semibold text-[#0E0E0E]">
                            {(business.name?.trim()?.charAt(0) || "B").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-[#0E0E0E]">
                            {business.name}
                          </p>
                          {reviewCount > 0 && (
                            <img
                              src="/brand/Tellacity%20Vefication%20Batch.png"
                              alt="Tellacity verified reviews"
                              className="h-5 w-5 shrink-0"
                            />
                          )}
                        </div>
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
                  </Link>
                );
              })}
            </div>

            {/* Desktop / tablet: grid layout */}
            <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {businesses.map((business) => {
                const reviewCount =
                  Number(business.review_count ?? 0) || 0;
                const ratingValue =
                  Number(business.trust_score ?? 0) || 0;

                const logoUrl = similarBusinessLogoUrl({
                  resolved_logo_url: business.resolved_logo_url,
                  logo_url: business.logo_url,
                  website: business.website,
                });

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
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={business.name ?? "Business"}
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-sm font-semibold text-[#0E0E0E]">
                            {(business.name?.trim()?.charAt(0) || "B").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-semibold text-[#0E0E0E]">
                            {business.name}
                          </p>
                          {reviewCount > 0 && (
                            <img
                              src="/brand/Tellacity%20Vefication%20Batch.png"
                              alt="Tellacity verified reviews"
                              className="h-5 w-5 shrink-0"
                            />
                          )}
                        </div>
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
                            business.id ?? "",
                          )}&businessName=${encodeURIComponent(
                            business.name ?? "",
                          )}&businessSlug=${encodeURIComponent(
                            business.slug ?? "",
                          )}`;
                        }}
                        className="inline-flex w-auto items-center justify-center rounded-full bg-gray-600 px-3 py-1 text-[11px] font-medium text-white shadow-[0_0_0_rgba(249,115,22,0)] transition-all duration-200 hover:bg-gray-700 hover:shadow-[0_0_16px_rgba(75,85,99,0.5),0_0_32px_rgba(75,85,99,0.25)] active:scale-95"
                      >
                        Review this Business
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
