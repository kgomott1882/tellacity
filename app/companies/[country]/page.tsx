import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  COUNTRY_LABELS,
  SUPPORTED_COUNTRY_CODES,
  normalizeCountryParam,
  toStorageCountryCode,
  type SupportedCountryCode,
} from "@/lib/seoCountries";

export const revalidate = 300;

type PageParams = {
  country: string;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

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

export async function generateMetadata(props: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { country } = await props.params;

  const normalized = normalizeCountryParam(country.toUpperCase());
  if (!normalized || !SUPPORTED_COUNTRY_CODES.includes(normalized)) {
    return {};
  }

  const label = COUNTRY_LABELS[normalized];
  const canonicalPath = `/companies/${country.toLowerCase()}`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  return {
    title: `Browse Companies in ${label} | Tellacity`,
    description: `Explore businesses in ${label}. Browse companies alphabetically and read verified customer reviews on Tellacity.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CompaniesCountryIndexPage(props: {
  params: Promise<PageParams>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { country: rawCountry } = await props.params;
  const searchParams = await props.searchParams;

  const normalized = normalizeCountryParam(rawCountry.toUpperCase());
  if (!normalized || !SUPPORTED_COUNTRY_CODES.includes(normalized)) {
    notFound();
  }

  const queryCountry = normalizeCountryParam(searchParams?.country);
  if (queryCountry && queryCountry !== normalized) {
    redirect(
      `/companies/${queryCountry.toLowerCase()}?country=${toStorageCountryCode(queryCountry)}`
    );
  }

  const label = COUNTRY_LABELS[normalized];
  const flagCode = COUNTRY_FLAG_CODE[normalized];
  const flagUrl = `${FLAG_BASE}/${flagCode}.svg`;
  const country = normalized.toLowerCase();
  const queryCountryCode = toStorageCountryCode(normalized);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const basePath = `/companies/${country}`;

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl flex items-center gap-2">
            <span>Browse Companies in {label}</span>
            <img
              src={flagUrl}
              alt={label}
              className="h-5 w-7 object-cover"
            />
          </h1>
          <p className="text-gray-600 mt-3 max-w-lg">
            Browse companies in this country alphabetically. Click a letter to
            explore businesses and read verified customer reviews on Tellacity.
          </p>

          <div className="mt-8 grid grid-cols-7 gap-3 max-w-md">
            {letters.map((letter) => (
              <Link
                key={letter}
                href={`${basePath}/${letter.toLowerCase()}?country=${queryCountryCode}`}
                className="flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-semibold text-[#0E0E0E] hover:border-[#1FAF9E] hover:text-[#1FAF9E] transition-colors"
              >
                {letter}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
