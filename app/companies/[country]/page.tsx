import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COUNTRY_LABELS,
  SUPPORTED_COUNTRY_CODES,
  normalizeCountryParam,
} from "@/lib/seoCountries";

export const revalidate = 300;

type PageParams = {
  country: string;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

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
}) {
  const { country: rawCountry } = await props.params;

  const normalized = normalizeCountryParam(rawCountry.toUpperCase());
  if (!normalized || !SUPPORTED_COUNTRY_CODES.includes(normalized)) {
    notFound();
  }

  const label = COUNTRY_LABELS[normalized];
  const country = normalized.toLowerCase();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const basePath = `/companies/${country}`;

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Browse Companies in {label}
          </h1>
          <p className="text-gray-600 mt-3 max-w-lg">
            Browse companies in this country alphabetically. Click a letter to
            explore businesses and read verified customer reviews on Tellacity.
          </p>

          <div className="mt-8 grid grid-cols-7 gap-3 max-w-md">
            {letters.map((letter) => (
              <Link
                key={letter}
                href={`${basePath}/${letter.toLowerCase()}`}
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
