import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  buildCompaniesCountryPageJsonLd,
  companiesCountryPageUrl,
  countryInPhrase,
} from "@/lib/companiesCountryPageJsonLd";
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

const FLAG_BASE = "https://purecatamphetamine.github.io/country-flag-icons/3x2";

const COUNTRY_FLAG_CODE: Record<SupportedCountryCode, string> = {
  US: "US",
  ZA: "ZA",
  UK: "GB",
  AU: "AU",
  CA: "CA",
  NZ: "NZ",
  IE: "IE",
};

function pageMetadata(code: SupportedCountryCode): Metadata {
  const label = COUNTRY_LABELS[code];
  const phrase = countryInPhrase(code, label);
  const pageUrl = companiesCountryPageUrl(code);
  const title = `Browse Companies in ${phrase} | Tellacity`;
  const description = `Browse companies in ${phrase} alphabetically, explore verified customer reviews, and compare trusted businesses on Tellacity.`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Tellacity",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export async function generateMetadata(props: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { country } = await props.params;

  const normalized = normalizeCountryParam(country.toUpperCase());
  if (!normalized || !SUPPORTED_COUNTRY_CODES.includes(normalized)) {
    return {};
  }

  return pageMetadata(normalized);
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
  const phrase = countryInPhrase(normalized, label);
  const flagCode = COUNTRY_FLAG_CODE[normalized];
  const flagUrl = `${FLAG_BASE}/${flagCode}.svg`;
  const country = normalized.toLowerCase();
  const queryCountryCode = toStorageCountryCode(normalized);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const basePath = `/companies/${country}`;
  const jsonLdScripts = buildCompaniesCountryPageJsonLd(normalized);

  return (
    <main className="bg-white">
      {jsonLdScripts.map((schema, index) => (
        <script
          key={`companies-country-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl flex items-center gap-2">
            <span>Browse Companies in {phrase}</span>
            <img
              src={flagUrl}
              alt={label}
              className="h-5 w-7 object-cover"
            />
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
            Browse companies in {phrase} alphabetically, explore verified
            customer reviews, and compare businesses across Tellacity. Use the
            letter grid to jump to companies by name and find trusted feedback
            faster. Each company profile connects to moderated reviews, rating
            summaries, and category context so you can compare options with
            confidence.
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

          <section className="mt-12 max-w-3xl space-y-4">
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              How the company directory works
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Alphabetical browsing is most useful when you already know a
              business name and want to find it quickly without running a
              separate search. Pick a letter to see companies that start with
              that character, then open a profile to read real customer
              experiences or write your own review.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Each company page on Tellacity includes verified customer reviews,
              photos, category context, and a TrustScore that summarises
              reputation signals. Pages are moderated and linked to verified
              customer experiences, not just static listings.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              The directory helps you compare businesses before making a choice.
              You can move from a letter page to individual profiles, then into
              related categories or rankings when you want broader context.
            </p>
          </section>

          <section className="mt-10 max-w-3xl space-y-4">
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Why this directory matters
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Tellacity is a review platform, not just a list of names. The
              company directory helps you discover businesses with real customer
              feedback, transparent ratings, and evidence you can trust before
              you buy, book, or sign up.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              It helps users navigate large sets of businesses without relying
              only on search. Alphabetical browsing supports trust and
              transparency by exposing verified reviews alongside each listing.
            </p>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              This directory complements{" "}
              <Link
                href="/categories"
                className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                category pages
              </Link>{" "}
              and best-in-category rankings, giving you another practical path
              into {phrase} businesses when you know where you want to start.
            </p>
          </section>

          <section className="mt-10 max-w-3xl space-y-4">
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Explore Tellacity
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
              Part of the{" "}
              <Link
                href="/reputation-platform"
                className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                Tellacity Reputation Platform
              </Link>{" "}
              for verified customer reviews and trusted business discovery.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600 sm:text-base">
              <li>
                <Link
                  href="/categories"
                  className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
                >
                  Browse categories
                </Link>
              </li>
              <li>
                <Link
                  href="/companies"
                  className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
                >
                  Browse companies by country
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
                >
                  FAQ
                </Link>{" "}
                and{" "}
                <Link
                  href="/about"
                  className="font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]"
                >
                  About Tellacity
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
