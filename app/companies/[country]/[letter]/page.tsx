import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { comparisonLinks } from "@/lib/comparisonLinks";
import {
  COUNTRY_LABELS,
  SUPPORTED_COUNTRY_CODES,
  normalizeCountryParam,
  toStorageCountryCode,
  type SupportedCountryCode,
} from "@/lib/seoCountries";

export const revalidate = 300;

const PAGE_LIMIT = 20;

type PageParams = {
  country: string;
  letter: string;
};

type BusinessRow = {
  slug: string | null;
  name: string | null;
  website?: string | null;
  website_display?: string | null;
};

function cleanDomain(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

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
  const { country, letter } = await props.params;

  const normalizedCountry = normalizeCountryParam(country.toUpperCase());
  if (!normalizedCountry) {
    return {};
  }

  const normalizedLetter = (letter || "").charAt(0).toUpperCase();
  if (!/^[A-Z]$/.test(normalizedLetter)) {
    return {};
  }

  const countryLabel = COUNTRY_LABELS[normalizedCountry];

  const canonicalPath = `/companies/${country.toLowerCase()}/${normalizedLetter.toLowerCase()}`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  return {
    title: `Companies starting with ${normalizedLetter} in ${normalizedCountry} | Tellacity`,
    description: `Browse companies starting with ${normalizedLetter} in ${countryLabel} on Tellacity. Discover real customer reviews and trusted business insights.`,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

async function fetchBusinessesByLetter(
  country: SupportedCountryCode,
  letter: string,
  offset: number
): Promise<BusinessRow[]> {
  const storageCode = toStorageCountryCode(country);

  const { data, error } = await supabaseServer
    .from("businesses")
    .select("slug, name, website, website_display")
    .eq("country_code", storageCode)
    .in("status", ["active", "ok"])
    .not("slug", "is", null)
    .ilike("name", `${letter.toLowerCase()}%`)
    .order("name", { ascending: true })
    .limit(PAGE_LIMIT)
    .range(offset, offset + PAGE_LIMIT - 1);

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? (data as BusinessRow[]) : [];
}

export default async function CompaniesCountryLetterPage(props: {
  params: Promise<PageParams>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { country: rawCountry, letter: rawLetter } = await props.params;
  const searchParams = await props.searchParams;

  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const offset = (page - 1) * PAGE_LIMIT;

  const normalizedCountry = normalizeCountryParam(rawCountry.toUpperCase());
  if (!normalizedCountry || !SUPPORTED_COUNTRY_CODES.includes(normalizedCountry)) {
    notFound();
  }

  const normalizedLetter = (rawLetter || "").charAt(0).toUpperCase();
  if (!/^[A-Z]$/.test(normalizedLetter)) {
    notFound();
  }

  let businesses: BusinessRow[] = [];

  try {
    businesses = await fetchBusinessesByLetter(
      normalizedCountry,
      normalizedLetter,
      offset
    );
  } catch {
    // Swallow errors and fall back to an empty list so the page never crashes.
    businesses = [];
  }

  const label = COUNTRY_LABELS[normalizedCountry];
  const flagCode = COUNTRY_FLAG_CODE[normalizedCountry];
  const flagUrl = `${FLAG_BASE}/${flagCode}.svg`;

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl flex items-center gap-2">
            <span>
              Companies starting with {normalizedLetter} in {label}
            </span>
            <img
              src={flagUrl}
              alt={label}
              className="h-5 w-7 object-cover"
            />
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600">
            Browse companies in {label} whose names start with{" "}
            {normalizedLetter}. Read customer reviews, ratings, and real
            experiences shared on Tellacity before choosing a business.
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white">
            {businesses.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-500">
                No companies found for this letter.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {businesses.map((biz) => {
                  const slug = (biz.slug ?? "").trim();
                  if (!slug) return null;
                  const name = (biz.name ?? "").trim() || "Business";

                  return (
                    <li key={slug}>
                      <Link
                        href={`/b/${encodeURIComponent(slug)}`}
                        className="flex items-center justify-between px-5 py-3 hover:bg-gray-50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#0E0E0E]">
                            {name}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

          <div className="mt-10 flex justify-center">
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white text-sm">
              {page > 1 ? (
                <a
                  href={`/companies/${rawCountry.toLowerCase()}/${normalizedLetter.toLowerCase()}?page=${page - 1}`}
                  className="border-r border-gray-200 px-4 py-2.5 text-gray-800 hover:bg-gray-50"
                >
                  Previous
                </a>
              ) : (
                <span className="border-r border-gray-200 px-4 py-2.5 text-gray-400">
                  Previous
                </span>
              )}

              <span className="border-r border-gray-200 px-4 py-2.5 font-semibold text-gray-800">
                Page {page}
              </span>

              {businesses.length === PAGE_LIMIT ? (
                <a
                  href={`/companies/${rawCountry.toLowerCase()}/${normalizedLetter.toLowerCase()}?page=${page + 1}`}
                  className="px-4 py-2.5 text-gray-800 hover:bg-gray-50"
                >
                  Next
                </a>
              ) : (
                <span className="px-4 py-2.5 text-gray-400">
                  Next
                </span>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

