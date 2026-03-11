import Link from "next/link";

export const revalidate = 300;

const countries = [
  { code: "us", name: "United States", flag: "🇺🇸" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧" },
  { code: "za", name: "South Africa", flag: "🇿🇦" },
  { code: "au", name: "Australia", flag: "🇦🇺" },
  { code: "ca", name: "Canada", flag: "🇨🇦" },
  { code: "nz", name: "New Zealand", flag: "🇳🇿" },
  { code: "ie", name: "Ireland", flag: "🇮🇪" },
];

export default function CompaniesDirectoryPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Browse Companies by Country
          </h1>

          <p className="text-gray-600 mt-3 max-w-xl">
            Explore businesses around the world. Select a country to browse
            companies alphabetically and read verified customer reviews on
            Tellacity.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {countries.map((country) => (
              <Link
                key={country.code}
                href={`/companies/${country.code}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-[#1FAF9E] hover:text-[#1FAF9E] transition-colors"
              >
                <span className="text-xl" aria-hidden="true">
                  {country.flag}
                </span>
                <span className="font-medium">{country.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  SUPPORTED_COUNTRY_CODES,
  COUNTRY_LABELS,
  countryPathSegment,
  toStorageCountryCode,
  type SupportedCountryCode,
} from "@/lib/seoCountries";

export const metadata: Metadata = {
  title: "Browse Businesses by Country | Tellacity",
  description:
    "Explore reviewed and listed businesses across supported countries on Tellacity. Start with a country to discover companies and their customer reviews.",
};

type CountryCountRow = {
  country_code: string | null;
  business_count: number | null;
};

const FLAG_BASE = "https://purecatamphetamine.github.io/country-flag-icons/3x2";

const COUNTRY_FLAG_CODE: Record<SupportedCountryCode, string> = {
  US: "US",
  ZA: "ZA",
  UK: "GB", // Use GB flag for United Kingdom
  AU: "AU",
  CA: "CA",
  NZ: "NZ",
  IE: "IE",
};

async function fetchCountryCounts(): Promise<
  Partial<Record<SupportedCountryCode, number>>
> {
  const map: Partial<Record<SupportedCountryCode, number>> = {};

  // 1) Try RPC first – preferred source of truth
  try {
    const { data, error } = await supabaseServer.rpc(
      "get_public_business_counts_by_country"
    );

    if (!error && Array.isArray(data)) {
      for (const row of data as CountryCountRow[]) {
        const rawCode = (row.country_code ?? "").toUpperCase();
        // Map storage code back to our public code, e.g. GB -> UK.
        const code = (SUPPORTED_COUNTRY_CODES as readonly string[]).find(
          (c) => toStorageCountryCode(c as SupportedCountryCode) === rawCode
        ) as SupportedCountryCode | undefined;
        if (!code) continue;
        const count = Number(row.business_count ?? 0);
        map[code] = (map[code] ?? 0) + (Number.isFinite(count) ? count : 0);
      }
    }
  } catch {
    // Ignore and fall back to direct counts below.
  }

  // 2) For any supported country that is missing or zero, fall back to a
  // direct COUNT(*) on the businesses table so numbers always reflect reality.
  for (const code of SUPPORTED_COUNTRY_CODES) {
    const existing = map[code];
    if (typeof existing === "number" && existing > 0) continue;

    const storageCode = toStorageCountryCode(code);

    const { count } = await supabaseServer
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("country_code", storageCode)
      .in("status", ["active", "ok"])
      .not("slug", "is", null);

    if (typeof count === "number" && count >= 0) {
      map[code] = count;
    }
  }

  return map;
}

export default async function CompaniesByCountryPage() {
  const counts = await fetchCountryCounts();

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Browse businesses by country
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600">
            Discover companies that are reviewed and listed on Tellacity. Choose
            a country to explore businesses and read real customer experiences.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUPPORTED_COUNTRY_CODES.map((code) => {
              const label = COUNTRY_LABELS[code];
              const path = `/companies/${countryPathSegment(code)}`;
              const rawCount = counts[code];
              const count =
                typeof rawCount === "number" && Number.isFinite(rawCount)
                  ? rawCount
                  : 0;
              const flagCode = COUNTRY_FLAG_CODE[code];
              const flagUrl = `${FLAG_BASE}/${flagCode}.svg`;

              return (
                <Link
                  key={code}
                  href={path}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-[#1FAF9E] hover:bg-[#F4FFFD]"
                >
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-semibold text-[#0E0E0E]">
                      <img
                        src={flagUrl}
                        alt={label}
                        className="h-4 w-6 object-cover"
                      />
                      <span>{label}</span>
                    </h2>
                    <p className="mt-2 text-xs text-gray-500 uppercase tracking-wide">
                      {code}
                    </p>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    {`${count.toLocaleString()} businesses listed`}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

