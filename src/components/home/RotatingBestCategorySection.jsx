import { useRef } from "react";
import Link from "next/link";
import { similarBusinessLogoUrl } from "@/lib/logo";
import RatingStars from "@/components/RatingStars";
import { CAROUSEL_NAV_BUTTON_CLASS } from "@/lib/carouselNavButton";
import { CarouselNavChevron } from "@/components/ui/CarouselNavChevron";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
import { cn } from "@/lib/utils";

const cleanDomain = (value) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

export default function RotatingBestCategorySection({
  categorySlug,
  categoryLabel,
  businesses,
  onPrevious,
  onNext,
  countryCode,
  countryName = "",
  /** True while best-in data for the active slug is not yet available (e.g. country switch). */
  isLoading = false,
}) {
  const hasBusinesses = Array.isArray(businesses) && businesses.length > 0;
  const cardsScrollRef = useRef(null);

  return (
    <FadeUp>
    <section>
      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-12 md:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <h2 className="home-section-title text-xl sm:text-2xl md:text-3xl">
              <span className="relative inline-block">
                <span className="relative inline-block">
                  <span className="relative z-10 home-section-title-accent">Best</span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#00B4A6]/25" />
                </span>
                {" "}in {categoryLabel}
              </span>
            </h2>
            <p className="home-section-sub mt-2 max-w-xl text-sm">
              {countryName
                ? `Top ${countryName} businesses in ${categoryLabel}, ranked by trust score and verified customer reviews.`
                : `Top businesses in ${categoryLabel}, ranked by trust score and verified customer reviews.`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onPrevious?.()}
              aria-label="Previous Best in category"
              className={cn(CAROUSEL_NAV_BUTTON_CLASS, "home-nav-btn")}
            >
              <CarouselNavChevron dir="left" />
            </button>
            <button
              type="button"
              onClick={() => onNext?.()}
              aria-label="Next Best in category"
              className={cn(CAROUSEL_NAV_BUTTON_CLASS, "home-nav-btn")}
            >
              <CarouselNavChevron dir="right" />
            </button>
            <Link
              href={
                countryCode
                  ? `/categories/${categorySlug}?country=${encodeURIComponent(
                      countryCode,
                    )}`
                  : `/categories/${categorySlug}`
              }
              className="home-pill-link rounded-full px-2.5 py-1 text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/40 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              More
            </Link>
          </div>
        </div>

        {!hasBusinesses && isLoading && (
          <p className="mt-6 text-sm text-[var(--home-muted,#4b5563)]">Loading ranked businesses…</p>
        )}
        {!hasBusinesses && !isLoading && (
          <p className="mt-6 text-sm text-[var(--home-muted,#4b5563)]">
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
              {businesses.map((business, index) => {
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
                  <StaggerFadeUp
                    key={`${business.slug ?? "business"}-${business.id ?? ""}-mobile`}
                    index={index}
                    className="shrink-0"
                  >
                  <Link
                    href={`/b/${business.slug}`}
                    className="home-glass-card group relative flex w-64 flex-col overflow-hidden rounded-2xl p-4"
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
                              className="home-verified-pulse h-5 w-5 shrink-0"
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
                  </StaggerFadeUp>
                );
              })}
            </div>

            {/* Desktop / tablet: grid layout */}
            <div className="home-best-in-grid mt-8 hidden gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {businesses.map((business, index) => {
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
                  <StaggerFadeUp
                    key={`${business.slug ?? "business"}-${business.id ?? ""}`}
                    index={index}
                  >
                  <Link
                    href={`/b/${business.slug}`}
                    className="home-glass-card group relative flex h-full flex-col overflow-hidden rounded-2xl p-4"
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
                        className="absolute h-64 w-64 rounded-full bg-[#00B4A6]/20 blur-3xl"
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
                              className="home-verified-pulse h-5 w-5 shrink-0"
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
                        className="home-review-business-btn inline-flex w-auto items-center justify-center rounded-full px-3 py-1 text-[11px] font-medium active:scale-95"
                      >
                        Review this Business
                      </button>
                    </div>
                  </Link>
                  </StaggerFadeUp>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
    </FadeUp>
  );
}
