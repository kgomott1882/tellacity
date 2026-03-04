import Link from "next/link";
import {
  normalizeLogoUrl,
  domainFromWebsite,
  getLogoDevUrl,
} from "@/lib/logo";
import RatingStars from "@/components/RatingStars";

const cleanDomain = (value) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

export default function RotatingBestCategorySection({
  categorySlug,
  categoryLabel,
  businesses,
}) {
  const hasBusinesses = Array.isArray(businesses) && businesses.length > 0;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-12 md:py-14">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
            <span className="relative inline-block">
              <span className="relative z-10">Best in {categoryLabel}</span>
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

        {!hasBusinesses && (
          <p className="mt-6 text-sm text-gray-500">
            No businesses found yet.
          </p>
        )}

        {hasBusinesses && (
          <>
            {/* Mobile: horizontal swipe carousel */}
            <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {businesses.map((business) => {
                const reviewCount = Number(business.review_count ?? 0) || 0;
                const ratingValue =
                  typeof business.trust_score === "number" && business.trust_score > 0
                    ? business.trust_score
                    : 0;
                const logoUrl =
                  normalizeLogoUrl(business.resolved_logo_url) ??
                  getLogoDevUrl(
                    domainFromWebsite(business.website_display ?? business.website),
                  );

                return (
                  <Link
                    key={`${business.slug ?? "business"}-${business.id ?? ""}-mobile`}
                    href={`/b/${business.slug}`}
                    className="group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
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
                  </Link>
                );
              })}
            </div>

            {/* Desktop / tablet: original grid layout */}
            <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {businesses.map((business) => {
                const reviewCount = Number(business.review_count ?? 0) || 0;
                const ratingValue =
                  typeof business.trust_score === "number" && business.trust_score > 0
                    ? business.trust_score
                    : 0;

                const logoUrl =
                  normalizeLogoUrl(business.resolved_logo_url) ??
                  getLogoDevUrl(
                    domainFromWebsite(business.website_display ?? business.website),
                  );

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
                            business.id ?? "",
                          )}&businessName=${encodeURIComponent(
                            business.name ?? "",
                          )}&businessSlug=${encodeURIComponent(
                            business.slug ?? "",
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
          </>
        )}
      </div>
    </section>
  );
}
