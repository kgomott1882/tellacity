import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import {
  COUNTRY_LABELS,
  SUPPORTED_COUNTRY_CODES,
  normalizeCountryParam,
  type SupportedCountryCode,
} from "@/lib/seoCountries";

const PAGE_SIZE = 50;

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

function parsePageParam(
  raw: string | string[] | undefined
): { page: number; offset: number } {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = parseInt(value ?? "1", 10);
  const page = Number.isFinite(n) && n > 0 ? n : 1;
  const offset = (page - 1) * PAGE_SIZE;
  return { page, offset };
}

type PageParams = {
  country: string;
};

type PageSearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(props: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const params = await props.params;
  const normalized = normalizeCountryParam(params.country);

  if (!normalized) {
    return {};
  }

  const label = COUNTRY_LABELS[normalized];

  return {
    title: `${normalized} Business Reviews & Companies | Tellacity`,
    description: `Browse reviewed and listed businesses in ${label} on Tellacity.`,
  };
}

async function fetchBusinessesForCountry(
  country: SupportedCountryCode,
  offset: number
): Promise<{ businesses: BusinessRow[]; total: number }> {
  const limit = PAGE_SIZE;

  const [{ data: businesses, error: bizError }, { data: totalData, error: countError }] =
    await Promise.all([
      supabaseServer.rpc("get_public_businesses_for_index", {
        p_country: country,
        p_limit: limit,
        p_offset: offset,
      }),
      supabaseServer.rpc("get_public_business_count", {
        p_country: country,
      }),
    ]);

  if (bizError) {
    throw bizError;
  }

  if (countError) {
    throw countError;
  }

  const list = Array.isArray(businesses)
    ? (businesses as BusinessRow[])
    : [];

  let total = 0;
  if (typeof totalData === "number") {
    total = totalData;
  } else if (Array.isArray(totalData) && totalData.length > 0) {
    const first = totalData[0] as any;
    total = Number(
      first?.total ??
        first?.count ??
        first?.business_count ??
        first?.businesses ??
        0
    );
  } else if (totalData && typeof totalData === "object") {
    const anyData = totalData as any;
    total = Number(
      anyData.total ??
        anyData.count ??
        anyData.business_count ??
        anyData.businesses ??
        0
    );
  }

  if (!Number.isFinite(total) || total < 0) {
    total = 0;
  }

  return { businesses: list, total };
}

export default async function CompaniesCountryPage(props: {
  params: Promise<PageParams>;
  searchParams: Promise<PageSearchParams>;
}) {
  const [{ country: rawCountry }, query] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const normalized = normalizeCountryParam(rawCountry);
  if (!normalized) {
    notFound();
  }

  const { page, offset } = parsePageParam(query.page);

  let data: { businesses: BusinessRow[]; total: number };
  try {
    data = await fetchBusinessesForCountry(normalized, offset);
  } catch {
    data = { businesses: [], total: 0 };
  }

  const { businesses, total } = data;
  const totalPages = total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);

  if (!SUPPORTED_COUNTRY_CODES.includes(normalized)) {
    notFound();
  }

  const label = COUNTRY_LABELS[normalized];

  const hasPrevious = safePage > 1;
  const hasNext = safePage < totalPages;

  const basePath = `/companies/${rawCountry.toLowerCase()}`;

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (targetPage > 1) {
      params.set("page", String(targetPage));
    }
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Businesses in {label}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600">
            Browse companies listed on Tellacity in {label}. Each business has a
            dedicated page where customers can share reviews and feedback.
          </p>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white">
            {businesses.length === 0 ? (
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-xs text-gray-600">
              <div>
                Page {safePage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={hasPrevious ? buildPageHref(safePage - 1) : "#"}
                  aria-disabled={!hasPrevious}
                  className={`rounded-full border px-3 py-1 font-medium ${
                    hasPrevious
                      ? "border-gray-300 text-[#0E0E0E] hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  Previous
                </Link>
                <Link
                  href={hasNext ? buildPageHref(safePage + 1) : "#"}
                  aria-disabled={!hasNext}
                  className={`rounded-full border px-3 py-1 font-medium ${
                    hasNext
                      ? "border-gray-300 text-[#0E0E0E] hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                      : "cursor-not-allowed border-gray-200 text-gray-400"
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

