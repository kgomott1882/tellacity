import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  SUPPORTED_COUNTRY_CODES,
  COUNTRY_LABELS,
  countryPathSegment,
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

async function fetchCountryCounts(): Promise<
  Partial<Record<SupportedCountryCode, number>>
> {
  const { data, error } = await supabaseServer.rpc(
    "get_public_business_counts_by_country"
  );

  if (error || !Array.isArray(data)) {
    return {};
  }

  const map: Partial<Record<SupportedCountryCode, number>> = {};

  for (const row of data as CountryCountRow[]) {
    const code = (row.country_code ?? "").toUpperCase() as SupportedCountryCode;
    if (!SUPPORTED_COUNTRY_CODES.includes(code)) continue;
    const count = Number(row.business_count ?? 0);
    map[code] = (map[code] ?? 0) + (Number.isFinite(count) ? count : 0);
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
              const count = counts[code];

              return (
                <Link
                  key={code}
                  href={path}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-[#1FAF9E] hover:bg-[#F4FFFD]"
                >
                  <div>
                    <h2 className="text-base font-semibold text-[#0E0E0E]">
                      {label}
                    </h2>
                    <p className="mt-2 text-xs text-gray-500 uppercase tracking-wide">
                      {code}
                    </p>
                  </div>
                  <p className="mt-4 text-xs text-gray-500">
                    {typeof count === "number" && count > 0
                      ? `${count.toLocaleString()} businesses listed`
                      : "Businesses continuously being added"}
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

