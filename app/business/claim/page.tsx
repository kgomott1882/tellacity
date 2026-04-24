"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl } from "@/lib/logo";
import BusinessSearchInput from "@/components/search/BusinessSearchInput";
import { buildBusinessSignupClaimPrefillUrl } from "@/lib/businessSignupClaimPrefill";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl: string | null;
  location: string;
  reviewCount: number;
};

const cleanDomain = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
};

const skeletons = Array.from({ length: 6 });

export default function BusinessClaimPage() {
  const [results, setResults] = useState<BusinessRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const runSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    setIsSearching(true);

    const supabase = supabaseBrowser();
    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, website, website_display, logo_url, city, country_code, review_count"
      )
      .eq("status", "active")
      .or(
        `name.ilike.%${trimmed}%,website.ilike.%${trimmed}%,website_display.ilike.%${trimmed}%`
      )
      .order("trust_score", { ascending: false, nullsFirst: false })
      .order("review_count", { ascending: false })
      .limit(20);

    if (error) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const rows = (data ?? []) as Array<{
      id: string;
      name?: string | null;
      slug?: string | null;
      website?: string | null;
      website_display?: string | null;
      logo_url?: string | null;
      city?: string | null;
      country_code?: string | null;
      review_count?: number | null;
    }>;

    const mapped: BusinessRow[] = rows.map((business) => ({
      id: business.id,
      name: business.name ?? "Business",
      slug: business.slug ?? "",
      domain: cleanDomain(business.website_display ?? business.website ?? ""),
      logoUrl: normalizeLogoUrl(business.logo_url ?? null),
      location: business.city ?? business.country_code ?? "",
      reviewCount: Number(business.review_count ?? 0) || 0,
    }));

    setResults(mapped);
    setIsSearching(false);
  };

  const signupUrl = (business: BusinessRow) =>
    buildBusinessSignupClaimPrefillUrl({
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug || null,
      website: business.domain || null,
    });

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            Claim your business
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Search for your business and request access to manage your profile.
          </p>
        </div>

        <div className="mt-6 w-full max-w-2xl">
          <BusinessSearchInput
            placeholder="Find businesses you can trust..."
            heroLayout
            heroButtonLabel="FIND A BUSINESS"
            onSelect={(business) => runSearch(business.name)}
            onSubmitQuery={(query) => runSearch(query)}
          />
        </div>

        {!isSearching && hasSearched && results.length > 0 && (
          <p className="mt-6 text-sm font-medium text-[#0E3B36]">
            We found your business. Claim it below to manage your profile.
          </p>
        )}

        <div className="mt-6 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
          {isSearching &&
            skeletons.map((_, index) => (
              <div
                key={`claim-skeleton-${index}`}
                className="flex flex-wrap items-center gap-4 px-4 py-5"
              >
                <div className="h-12 w-12 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-100" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                </div>
                <div className="h-8 w-28 rounded-full bg-gray-100" />
              </div>
            ))}

          {!isSearching && hasSearched && results.length === 0 && (
            <div className="px-4 py-8 text-sm text-gray-500">
              No businesses found. Try another search.
            </div>
          )}

          {!isSearching &&
            results.map((business) => (
              <div
                key={business.id}
                className="flex flex-wrap items-center gap-4 px-4 py-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#FCF7F6]">
                  {business.logoUrl ? (
                    <img
                      src={normalizeLogoUrl(business.logoUrl) ?? business.logoUrl}
                      alt=""
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-[#0E0E0E]">
                      {(business.name?.trim()?.charAt(0) || "B").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <div className="text-base font-semibold text-[#0E0E0E]">
                      {business.name}
                    </div>
                    {business.reviewCount > 0 && (
                      <img
                        src="/brand/Tellacity%20Vefication%20Batch.png"
                        alt="Tellacity verified reviews"
                        className="h-5 w-5 shrink-0"
                      />
                    )}
                  </div>
                  {business.domain ? (
                    <div className="text-sm text-gray-500">{business.domain}</div>
                  ) : null}
                  {business.location ? (
                    <div className="text-xs text-gray-400">{business.location}</div>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <Link
                    href={signupUrl(business)}
                    className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#169786]"
                  >
                    Claim your business
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
