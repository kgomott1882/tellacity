import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  COUNTRY_LABELS,
  SUPPORTED_COUNTRY_CODES,
  normalizeCountryParam,
  toStorageCountryCode,
  type SupportedCountryCode,
} from "@/lib/seoCountries";

export const revalidate = 300;

const PAGE_SIZE = 50;
const FLAG_BASE = "https://purecatamphetamine.github.io/country-flag-icons/3x2";

const COUNTRY_FLAG_CODE: Record<SupportedCountryCode, string> = {
  US: "US",
  ZA: "ZA",
  UK: "GB", // GB flag for United Kingdom
  AU: "AU",
  CA: "CA",
  NZ: "NZ",
  IE: "IE",
};

type BusinessRow = {
  slug: string | null;
  name: string | null;
  website?: string | null;
  website_display?: string | null;
  updated_at?: string | null;
};

function cleanDomain(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

type PageParams = {
  country: string;
};

type PageSearchParams = Record<string, string | string[] | undefined>;

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

export async function generateMetadata(props: {
  params: Promise<PageParams>;
  searchParams?: Promise<PageSearchParams>;
}): Promise<Metadata> {
  const [params, rawSearch] = await Promise.all([
    props.params,
    props.searchParams ?? Promise.resolve<PageSearchParams>({}),
  ]);

  const normalized = normalizeCountryParam(params.country.toUpperCase());
  if (!normalized) {
    return {};
  }

  const label = COUNTRY_LABELS[normalized];
  const canonicalPath = `/companies/${params.country.toLowerCase()}`;
  const canonicalUrl = `${BASE_URL}${canonicalPath}`;

  const searchParams = rawSearch || {};
  const rawCursor = searchParams.cursor ?? undefined;
  const hasCursor =
    typeof rawCursor === "string" && rawCursor.trim().length > 0;

  const robots =
    hasCursor
      ? {
          index: false,
          follow: true,
        }
      : {
          index: true,
          follow: true,
        };

  return {
    title: `${normalized} Business Reviews & Companies | Tellacity`,
    description: `Browse reviewed and listed businesses in ${label} on Tellacity.`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots,
  };
}

async function fetchBusinessesForCountry(
  country: SupportedCountryCode,
  cursor: string | null
): Promise<BusinessRow[]> {
  const storageCode = toStorageCountryCode(country);

  const { data: businesses, error } =
    await supabaseServer.rpc("get_companies_by_country_cursor", {
      p_country_code: storageCode,
      p_cursor: cursor,
      p_limit: PAGE_SIZE,
    });

  if (error) {
    throw error;
  }

  return Array.isArray(businesses) ? (businesses as BusinessRow[]) : [];
}

async function fetchTotalForCountry(
  country: SupportedCountryCode
): Promise<number> {
  const storageCode = toStorageCountryCode(country);
  const { data, error } = await supabaseServer.rpc(
    "get_public_business_count",
    {
      p_country_code: storageCode,
    }
  );

  if (error) {
    throw error;
  }

  return typeof data === "number" ? data : Number(data ?? 0);
}

export default async function CompaniesCountryPage(props: {
  params: Promise<PageParams>;
  searchParams?: Promise<PageSearchParams>;
}) {
  const { country: rawCountry } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};

  const normalized = normalizeCountryParam(rawCountry.toUpperCase());
  if (!normalized) {
    notFound();
  }

  const rawCursor = searchParams.cursor;
  const cursor: string | null =
    typeof rawCursor === "string"
      ? rawCursor
      : Array.isArray(rawCursor)
      ? rawCursor[0] ?? null
      : null;

  const rawPrev = searchParams.prev;

  const prevStack =
    typeof rawPrev === "string"
      ? rawPrev.split("|").filter((value) => value.length > 0)
      : [];

  const [businesses, total] = await Promise.all([
    fetchBusinessesForCountry(normalized, cursor),
    fetchTotalForCountry(normalized),
  ]);

  const isInitialPage = !cursor;
  const nextCursor =
    businesses.length > 0
      ? businesses[businesses.length - 1]?.name ?? null
      : null;

  if (!SUPPORTED_COUNTRY_CODES.includes(normalized)) {
    notFound();
  }

  const label = COUNTRY_LABELS[normalized];
  const flagCode = COUNTRY_FLAG_CODE[normalized];
  const flagUrl = `${FLAG_BASE}/${flagCode}.svg`;

  const page = prevStack.length + 1;
  const shownSoFar = prevStack.length * PAGE_SIZE + businesses.length;
  const totalPages =
    total > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : page;
  const remaining =
    total > 0 && total > shownSoFar ? total - shownSoFar : 0;

  const hasPrevious = prevStack.length > 0;
  const hasNext = businesses.length === PAGE_SIZE && !!nextCursor;

  const basePath = `/companies/${rawCountry.toLowerCase()}`;

  const buildHref = (targetCursor: string | null, nextPrevStack: string[]) => {
    const params = new URLSearchParams();
    if (targetCursor && targetCursor.length > 0) {
      params.set("cursor", targetCursor);
    }
    if (nextPrevStack.length > 0) {
      params.set("prev", nextPrevStack.join("|"));
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const buildNextHref = () => {
    if (!hasNext || !nextCursor) return "#";
    const nextPrevStack = [...prevStack, cursor ?? ""];
    return buildHref(nextCursor, nextPrevStack);
  };

  const buildPreviousHref = () => {
    if (!hasPrevious) return "#";
    const newPrevStack = prevStack.slice(0, -1);
    const previousCursor = prevStack[prevStack.length - 1];
    const cursorValue =
      previousCursor && previousCursor.length > 0 ? previousCursor : null;
    return buildHref(cursorValue, newPrevStack);
  };

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="flex items-center gap-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            <img
              src={flagUrl}
              alt={label}
              className="h-6 w-9 object-cover rounded-sm"
            />
            <span>Businesses in {label}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600">
            Browse companies listed on Tellacity in {label}. Each business has a
            dedicated page where customers can share reviews and feedback.
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white">
            {isInitialPage && businesses.length === 0 ? (
              <div className="px-5 py-6 text-sm text-gray-500">
                No businesses are available in this country yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {businesses.map((biz) => {
                  const slug = (biz.slug ?? "").trim();
                  if (!slug) return null;
                  const name = (biz.name ?? "").trim() || "Business";
                  const domain = cleanDomain(
                    (biz.website_display ?? biz.website ?? "")?.toString()
                  );

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
                          {domain && (
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {domain}
                            </p>
                          )}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {(hasPrevious || hasNext) && (
            <div className="mt-6 flex items-center justify-between text-xs text-gray-600">
              <div />
              <div className="flex items-center gap-2">
                {hasPrevious && (
                  <Link
                    href={buildPreviousHref()}
                    aria-disabled={!hasPrevious}
                    className={`rounded-full border px-3 py-1 font-medium ${
                      hasPrevious
                        ? "border-gray-300 text-[#0E0E0E] hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                        : "cursor-not-allowed border-gray-200 text-gray-400"
                    }`}
                  >
                    Previous
                  </Link>
                )}
                {hasNext && (
                  <Link
                    href={buildNextHref()}
                    aria-disabled={!hasNext}
                    className={`rounded-full border px-3 py-1 font-medium ${
                      hasNext
                        ? "border-gray-300 text-[#0E0E0E] hover-border-[#1FAF9E] hover:text-[#1FAF9E]"
                        : "cursor-not-allowed border-gray-200 text-gray-400"
                    }`}
                  >
                    Next
                  </Link>
                )}
                {total > 0 && (
                  <span className="ml-1 text-[11px] text-gray-500">
                    Page {page} of {totalPages}
                    {remaining > 0
                      ? ` · ${remaining.toLocaleString()} remaining`
                      : ""}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

