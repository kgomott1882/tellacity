"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl, resolveBusinessLogoViaClient, domainFromWebsite } from "@/lib/logo";
import { useBusinessAuth } from "@/lib/useBusinessAuth";

type BusinessRow = {
  id: string;
  name: string;
  domain: string;
  logoUrl: string | null;
  location: string;
};

type ClaimStatus = "idle" | "requested" | "already_requested";

const cleanDomain = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return value.replace(/^https?:\/\//, "").replace(/^www\./, "");
};

const skeletons = Array.from({ length: 6 });

export default function BusinessClaimPage() {
  const router = useRouter();
  const { user, isBusiness, loading } = useBusinessAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BusinessRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [claimStatus, setClaimStatus] = useState<Record<string, ClaimStatus>>(
    {}
  );
  const [businessProfile, setBusinessProfile] = useState<{
    email: string;
    business_name: string | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/business/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user) {
        return;
      }
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("business_profiles")
        .select("email, business_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setBusinessProfile({
        email: data?.email ?? user.email ?? "",
        business_name: data?.business_name ?? null,
      });
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  const handleSearch = async () => {
    if (!trimmedQuery) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, website, website_display, logo_url, city, country_code"
      )
      .eq("status", "active")
      .or(
        `name.ilike.%${trimmedQuery}%,website.ilike.%${trimmedQuery}%,website_display.ilike.%${trimmedQuery}%`
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
      website?: string | null;
      website_display?: string | null;
      logo_url?: string | null;
      city?: string | null;
      country_code?: string | null;
    }>;
    const mapped: typeof results = [];
    for (const business of rows) {
      let logoUrl = normalizeLogoUrl(business.logo_url ?? null);
      if (!logoUrl) {
        const domain = domainFromWebsite(business.website_display ?? business.website);
        if (domain) {
          const fromEdge = await resolveBusinessLogoViaClient(supabase, domain);
          if (fromEdge) logoUrl = fromEdge;
        }
      }
      mapped.push({
        id: business.id,
        name: business.name ?? "Business",
        domain: cleanDomain(business.website_display ?? business.website ?? ""),
        logoUrl: normalizeLogoUrl(logoUrl),
        location: business.city ?? business.country_code ?? "",
      });
    }

    setResults(mapped);
    setIsSearching(false);
  };

  const handleClaim = async (business: BusinessRow) => {
    if (!user) {
      return;
    }

    const existingStatus = claimStatus[business.id];
    if (existingStatus === "requested" || existingStatus === "already_requested") {
      return;
    }

    const { data: existingRequest } = await supabase
      .from("business_claim_requests")
      .select("id, status")
      .eq("business_id", business.id)
      .eq("requester_user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (existingRequest) {
      setClaimStatus((prev) => ({
        ...prev,
        [business.id]: "already_requested",
      }));
      return;
    }

    const requesterEmail = businessProfile?.email ?? user.email ?? "";
    const { error } = await supabase
      .from("business_claim_requests")
      .insert({
        business_id: business.id,
        requester_user_id: user.id,
        requester_email: requesterEmail,
        requester_business_name: businessProfile?.business_name ?? null,
        status: "pending",
      });

    if (error) {
      return;
    }

    setClaimStatus((prev) => ({
      ...prev,
      [business.id]: "requested",
    }));
  };

  if (loading) {
    return (
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <p className="text-sm text-gray-600">Loading...</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (!isBusiness) {
    return (
      <main className="bg-white">
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">
            Access denied
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            You do not have permission to access this page.
          </p>
        </section>
      </main>
    );
  }

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

        <form
          className="mt-6 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            handleSearch();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search business name or website…"
            className="w-full rounded-full border border-gray-200 px-5 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
          />
          <button
            type="submit"
            className="rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
          >
            Search
          </button>
        </form>

        <div className="mt-10 divide-y divide-gray-200 rounded-2xl border border-gray-200">
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

          {!isSearching && trimmedQuery && results.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">
              No businesses found. Try another search.
            </div>
          )}

          {!isSearching &&
            results.map((business) => {
              const status = claimStatus[business.id] ?? "idle";
              return (
                <div
                  key={business.id}
                  className="flex flex-wrap items-center gap-4 px-4 py-5"
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
                    ) : null}
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <div className="text-base font-semibold text-[#0E0E0E]">
                      {business.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {business.domain}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {business.location}
                  </div>
                  <div className="ml-auto">
                    {status === "requested" ? (
                      <span className="rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E]">
                        Claim requested
                      </span>
                    ) : status === "already_requested" ? (
                      <span className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500">
                        Already requested
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaim(business)}
                        className="rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E]"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </main>
  );
}
