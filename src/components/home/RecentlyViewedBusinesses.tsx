"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RatingStars from "@/components/RatingStars";
import { similarBusinessLogoUrl } from "@/lib/logo";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasFunctionalConsent,
} from "@/lib/cookieConsent";
import { getRecentBusinessViews } from "@/lib/firstPartyCookies";
import { FadeUp } from "@/components/ui/MotionWrapper";

const MAX_RECENT = 4;

type RecentBusiness = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  trust_score: number | null;
  average_rating: number | null;
  review_count: number;
  city: string | null;
  country_code: string | null;
};

function ratingForBusiness(business: RecentBusiness): number {
  return (
    Number(business.trust_score ?? business.average_rating ?? 0) || 0
  );
}

function RecentBusinessCard({ business }: { business: RecentBusiness }) {
  const reviewCount = Number(business.review_count) || 0;
  const ratingValue = ratingForBusiness(business);
  const logo = similarBusinessLogoUrl({
    resolved_logo_url: business.logo_url,
    logo_url: business.logo_url,
    website: business.website,
  });

  return (
    <Link
      href={`/b/${encodeURIComponent(business.slug)}`}
      className="flex h-full min-w-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#1FAF9E]/40 hover:shadow-md"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            className="h-full w-full object-contain"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-lg font-semibold text-[#124541]">
            {business.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1">
          <p className="truncate text-sm font-semibold text-[#0E0E0E]">{business.name}</p>
          {reviewCount > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/brand/Tellacity%20Vefication%20Batch.png"
              alt="Tellacity verified reviews"
              className="h-5 w-5 shrink-0"
            />
          ) : null}
        </div>
        {reviewCount > 0 ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-600">
            <RatingStars
              rating={ratingValue}
              reviewCount={reviewCount}
              size={12}
              className="home-rating-gold shrink-0"
            />
            <span className="shrink-0 font-medium text-[#0E0E0E]">
              {ratingValue.toFixed(1)}
            </span>
            <span className="shrink-0 text-gray-500" aria-hidden>
              ·
            </span>
            <span className="shrink-0 text-gray-600">
              {reviewCount.toLocaleString("en-US")}{" "}
              {reviewCount === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500">No reviews yet</p>
        )}
      </div>
    </Link>
  );
}

export default function RecentlyViewedBusinesses() {
  const [businesses, setBusinesses] = useState<RecentBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!hasFunctionalConsent()) {
        if (!cancelled) {
          setBusinesses([]);
          setLoading(false);
        }
        return;
      }

      const views = getRecentBusinessViews().slice(0, MAX_RECENT);
      if (views.length === 0) {
        if (!cancelled) {
          setBusinesses([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const slugs = views.map((v) => v.slug).join(",");
        const res = await fetch(
          `/api/visitor/recent-businesses?slugs=${encodeURIComponent(slugs)}`,
          { credentials: "same-origin" },
        );
        if (!res.ok) {
          if (!cancelled) setBusinesses([]);
          return;
        }
        const json = (await res.json()) as { businesses?: RecentBusiness[] };
        if (!cancelled) {
          setBusinesses(
            (Array.isArray(json.businesses) ? json.businesses : []).slice(0, MAX_RECENT),
          );
        }
      } catch {
        if (!cancelled) setBusinesses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, load);
    };
  }, []);

  if (loading || businesses.length === 0) return null;

  return (
    <FadeUp>
      <section className="mx-auto max-w-7xl px-6 py-10 sm:py-12 md:py-14">
        <div className="mb-6 max-w-2xl">
          <h2 className="home-section-title text-xl sm:text-2xl md:text-3xl">
            <span className="relative inline-block">
              <span className="relative inline-block">
                <span className="relative z-10 home-section-title-accent">Pick</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#00B4A6]/25" />
              </span>
              {" "}up where you left off
            </span>
          </h2>
          <p className="home-section-sub mt-2 max-w-xl text-sm">
            Businesses you recently viewed on Tellacity.
          </p>
        </div>

        {/* Mobile: horizontal swipe */}
        <div
          className="flex gap-3 overflow-x-auto pb-1 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Recently viewed businesses"
        >
          {businesses.map((business) => (
            <div key={business.id} className="w-[min(85vw,18rem)] shrink-0">
              <RecentBusinessCard business={business} />
            </div>
          ))}
        </div>

        {/* Tablet / desktop: grid (max 4) */}
        <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {businesses.map((business) => (
            <RecentBusinessCard key={business.id} business={business} />
          ))}
        </div>
      </section>
    </FadeUp>
  );
}
