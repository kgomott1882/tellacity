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

      const views = getRecentBusinessViews();
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
          setBusinesses(Array.isArray(json.businesses) ? json.businesses : []);
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
    <FadeUp className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-5 max-w-3xl">
        <h2 className="text-2xl font-semibold tracking-tight text-[#0E0E0E]">
          Pick up where you left off
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Businesses you recently viewed on Tellacity.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {businesses.map((business) => {
          const rating =
            Number(business.trust_score ?? business.average_rating ?? 0) || 0;
          const logo = similarBusinessLogoUrl({
            resolved_logo_url: business.logo_url,
            logo_url: business.logo_url,
            website: business.website,
          });
          return (
            <Link
              key={business.id}
              href={`/b/${encodeURIComponent(business.slug)}`}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#1FAF9E]/40 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-lg font-semibold text-[#124541]">
                    {business.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0E0E0E]">
                  {business.name}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-600">
                  <RatingStars rating={rating} size={12} />
                  <span>{rating.toFixed(1)}</span>
                  <span aria-hidden>·</span>
                  <span>{Number(business.review_count) || 0} reviews</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </FadeUp>
  );
}
