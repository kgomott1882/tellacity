"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe2, RefreshCw, X } from "lucide-react";

import { COUNTRY_MAP } from "@/lib/adminCountries";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const FLAG_BASE =
  "https://purecatamphetamine.github.io/country-flag-icons/3x2";

type CountryRow = {
  country_code: string;
  business_count: number;
  review_count: number;
};

function parseCount(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return 0;
}

let cachedRegionDisplay: Intl.DisplayNames | null | undefined;
function regionDisplay(): Intl.DisplayNames | null {
  if (cachedRegionDisplay !== undefined) return cachedRegionDisplay;
  try {
    cachedRegionDisplay = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    cachedRegionDisplay = null;
  }
  return cachedRegionDisplay;
}

function countryNameFromCode(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!upper) return "Unknown / missing";
  const mapped = COUNTRY_MAP[upper];
  if (mapped) {
    const stripped = mapped.replace(/^\p{Extended_Pictographic}+\s*/u, "").trim();
    if (stripped) return stripped;
  }
  const display = regionDisplay();
  if (display) {
    try {
      const name = display.of(upper);
      if (name && name !== upper) return name;
    } catch {
      /* fall through */
    }
  }
  return upper;
}

function flagUrlForCode(code: string): string | null {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return `${FLAG_BASE}/${upper}.svg`;
}

export default function AdminBusinessesByCountryPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCountry = (searchParams.get("country") ?? "").trim().toUpperCase();

  const setCountryParam = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim().toUpperCase();
      if (trimmed) {
        params.set("country", trimmed);
      } else {
        params.delete("country");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const [rows, setRows] = useState<CountryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const supabase = supabaseBrowser();
      const { data, error: rpcError } = await supabase.rpc(
        "admin_business_counts_by_country"
      );
      if (cancelled) return;
      if (rpcError) {
        setRows([]);
        setError(rpcError.message);
        setLoading(false);
        return;
      }
      const list = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
      setRows(
        list.map((r) => ({
          country_code: String(r.country_code ?? "").trim(),
          business_count: parseCount(r.business_count),
          review_count: parseCount(r.review_count),
        }))
      );
      setLastUpdated(new Date());
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const totals = useMemo(() => {
    const businesses = rows.reduce((a, r) => a + r.business_count, 0);
    const reviews = rows.reduce((a, r) => a + r.review_count, 0);
    const countries = rows.filter((r) => r.country_code).length;
    return { businesses, reviews, countries };
  }, [rows]);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1FAF9E]/10">
            <Globe2 className="h-5 w-5 text-[#1FAF9E]" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Businesses by country
            </h2>
            <p className="text-xs text-neutral-500">
              Live totals of active businesses and published reviews, grouped by{" "}
              <code className="rounded bg-neutral-100 px-1">country_code</code>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          {activeCountry ? (
            <button
              type="button"
              onClick={() => setCountryParam("")}
              className="inline-flex items-center gap-1 rounded-full border border-[#1FAF9E]/30 bg-[#1FAF9E]/10 px-2 py-1 text-xs font-medium text-[#0F766E] hover:bg-[#1FAF9E]/15"
              title="Clear country filter"
            >
              Filtering by {countryNameFromCode(activeCountry)}
              <X className="h-3 w-3" aria-hidden />
            </button>
          ) : null}
          {lastUpdated ? (
            <span className="tabular-nums">
              Updated{" "}
              {lastUpdated.toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">Loading country totals…</p>
      ) : rows.length === 0 && !error ? (
        <p className="mt-4 text-sm text-neutral-500">
          No active businesses found.
        </p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {rows.map((row) => {
              const name = countryNameFromCode(row.country_code);
              const flagUrl = flagUrlForCode(row.country_code);
              const code = row.country_code.toUpperCase();
              const isActive = !!code && activeCountry === code;
              const isDisabled = !code;
              const handleClick = () => {
                if (isDisabled) return;
                setCountryParam(isActive ? "" : code);
              };
              return (
                <button
                  type="button"
                  key={code || "unknown"}
                  onClick={handleClick}
                  disabled={isDisabled}
                  aria-pressed={isActive}
                  className={`group flex flex-col rounded-lg border px-3 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E] focus-visible:ring-offset-1 ${
                    isActive
                      ? "border-[#1FAF9E] bg-[#1FAF9E]/10 shadow-sm"
                      : "border-neutral-200 bg-neutral-50/60 hover:border-[#1FAF9E]/40 hover:bg-white"
                  } ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                  title={
                    isDisabled
                      ? `${name}: ${row.business_count.toLocaleString("en-US")} businesses (no country code, can't filter)`
                      : isActive
                        ? `Showing ${name} only, click to clear`
                        : `Click to show only ${name} businesses`
                  }
                >
                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700">
                    {flagUrl ? (
                      <img
                        src={flagUrl}
                        alt={`${name} flag`}
                        className="h-3 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-neutral-200"
                        loading="lazy"
                      />
                    ) : (
                      <Globe2
                        className="h-3.5 w-3.5 shrink-0 text-neutral-500"
                        aria-hidden
                      />
                    )}
                    <span className="truncate">{name}</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span
                      className={`text-lg font-semibold tabular-nums ${
                        isActive ? "text-[#0F766E]" : "text-neutral-900"
                      }`}
                    >
                      {row.business_count.toLocaleString("en-US")}
                    </span>
                    <span className="text-[10px] tabular-nums text-neutral-500">
                      {row.review_count.toLocaleString("en-US")} reviews
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-neutral-600">
            <strong>{totals.businesses.toLocaleString("en-US")}</strong> active
            businesses across <strong>{totals.countries}</strong>{" "}
            {totals.countries === 1 ? "country" : "countries"} ·{" "}
            <strong>{totals.reviews.toLocaleString("en-US")}</strong> published /
            live reviews
          </p>
        </>
      )}
    </section>
  );
}
