import type { Metadata } from "next";
import Link from "next/link";
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

export default async function CompaniesByCountryPage() {

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
              const flagCode = COUNTRY_FLAG_CODE[code];
              const flagUrl = `${FLAG_BASE}/${flagCode}.svg`;

              return (
                <Link
                  key={code}
                  href={path}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-[#1FAF9E] hover:bg-[#F4FFFD]"
                >
                  <h2 className="flex items-center gap-2 text-base font-semibold text-[#0E0E0E]">
                    <img
                      src={flagUrl}
                      alt={label}
                      className="h-4 w-6 object-cover"
                    />
                    <span>{label}</span>
                  </h2>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

