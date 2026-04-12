"use client";

import Link from "next/link";
function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getActiveCountry } from "@/lib/getActiveCountry";
import { formatBusinessTagLabel, normalizeBusinessTags } from "@/lib/businessTags";
import { normalizeLogoUrl } from "@/lib/logo";

type SearchResult = {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logoUrl: string | null;
  trustScore: number;
  reviewCount: number;
  location: string;
  tags?: string[] | null;
};

const cleanDomain = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
};

const skeletons = Array.from({ length: 8 });

export default function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  useEffect(() => {
    setActiveCountry(getActiveCountry());
    const handleSync = () => setActiveCountry(getActiveCountry());
    window.addEventListener("storage", handleSync);
    window.addEventListener("tellacity-country-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("tellacity-country-change", handleSync);
    };
  }, []);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let isMounted = true;
    const q = (searchParams.get("q") ?? "").trim();

    setQuery(q);

    if (!q) {
      setResults([]);
      setIsLoading(false);
      setLastQuery("");
      return;
    }

    if (q === lastQuery) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const fetchResults = async () => {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, website, website_display, logo_url, trust_score, review_count, country_code, city, tags"
        )
        .eq("status", "active")
        .or(
          `name.ilike.%${q}%,website_display.ilike.%${q}%,website.ilike.%${q}%`
        )
        .order("trust_score", { ascending: false, nullsFirst: false })
        .order("review_count", { ascending: false })
        .limit(30);

      if (!isMounted) {
        return;
      }

      if (error) {
        setResults([]);
      } else {
        const rows = data ?? [];
        const mapped: SearchResult[] = [];
        for (const business of rows) {
          const logoUrl = normalizeLogoUrl(business.logo_url ?? null);
          mapped.push({
            id: business.id,
            name: business.name ?? "Business",
            slug: business.slug ?? "",
            domain: cleanDomain(business.website_display ?? business.website ?? ""),
            logoUrl: normalizeLogoUrl(logoUrl),
            trustScore: Number(business.trust_score ?? 0),
            reviewCount: Number(business.review_count ?? 0),
            location: business.city ?? business.country_code ?? "",
            tags: normalizeBusinessTags(business.tags),
          });
        }
        setResults(mapped);
      }

      setLastQuery(q);
      setIsLoading(false);
    };

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [searchParams, lastQuery, activeCountry]);

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            Search results
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {initialQuery
              ? `Results for “${initialQuery}”`
              : "Type to search for a business or category."}
          </p>
        </div>

        <form
          className="mt-6 w-full max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            if (!trimmedQuery) {
              return;
            }
            router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
          }}
        >
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for a business or category..."
              className="w-full rounded-full border border-neutral-300 px-5 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20 focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-[#1FAF9E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/50"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-10 divide-y divide-gray-200 rounded-2xl border border-gray-200">
          {isLoading &&
            skeletons.map((_, index) => (
              <div
                key={`search-skeleton-${index}`}
                className="flex flex-wrap items-center gap-4 px-4 py-5"
              >
                <div className="h-12 w-12 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-100" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                </div>
                <div className="h-4 w-24 rounded bg-gray-100" />
              </div>
            ))}

          {!isLoading && initialQuery && results.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">
              <p>No businesses found. Try another search.</p>
              <Link
                href="/categories"
                className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                Browse categories
              </Link>
            </div>
          )}

          {!isLoading &&
            results.map((business) => {
              const safeSlug = (business.slug ?? "").trim().toLowerCase();
              if (!isValidSlug(safeSlug)) return null;
              const businessTags = normalizeBusinessTags(business.tags);
              return (
              <Link
                key={business.id}
                href={`/b/${safeSlug}`}
                className="flex flex-wrap items-center gap-4 px-4 py-5 transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-[#FCF7F6]">
                  {business.logoUrl ? (
                    <img
                      src={normalizeLogoUrl(business.logoUrl) ?? business.logoUrl}
                      alt={`${business.name} logo`}
                      className="h-full w-full object-contain"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
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
                <div className="min-w-[220px] flex-1">
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
                  <div className="text-sm text-gray-500">{business.domain}</div>
                  {businessTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {businessTags.map((tag) => (
                        <span
                          key={`${business.id}-${tag}`}
                          className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                        >
                          {formatBusinessTagLabel(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1 text-[#1FAF9E]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <span
                        key={`${business.id}-star-${index}`}
                        className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[#1FAF9E] text-xs text-white"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="font-medium text-[#0E0E0E]">
                    {business.trustScore.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({business.reviewCount})
                  </span>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  {business.location}
                </div>
              </Link>
            );
            })}
        </div>
      </section>
    </main>
  );
}

