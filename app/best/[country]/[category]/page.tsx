import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  COUNTRY_LABELS,
  normalizeCountryParam,
  toStorageCountryCode,
} from "@/lib/seoCountries";
import CategoryInfoTooltip from "@/components/categories/CategoryInfoTooltip";
import RatingStars from "@/components/RatingStars";
import { formatBusinessAddress } from "@/lib/address";
import {
  businessCategoryPillClassName,
  businessTagPillClassName,
  formatBusinessTagLabel,
  mergeTagsForDisplay,
} from "@/lib/businessTags";
import { similarBusinessLogoUrl } from "@/lib/logo";
import { sanitizeText } from "@/lib/sanitizeText";

type PageProps = {
  params: Promise<{ country: string; category: string }>;
};

type BusinessRow = {
  id: string;
  slug: string | null;
  name: string | null;
  trust_score: number | null;
  review_count: number | null;
  website: string | null;
  category_slug: string | null;
  country_code: string | null;
  address: string | null;
  city: string | null;
  logo_url?: string | null;
  average_rating?: number | null;
  tags?: unknown;
  secondary_category_slugs?: unknown;
};

const BUSINESS_LIST_SELECT =
  "id, name, slug, trust_score, review_count, website, category_slug, country_code, address, city, logo_url, average_rating, tags, secondary_category_slugs";

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

function toLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function snapshotRating(row: BusinessRow): number {
  return (
    (Number(row.trust_score ?? 0) || 0) ||
    (Number(row.average_rating ?? 0) || 0)
  );
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { country, category } = await props.params;
  const normalizedCountry = normalizeCountryParam(country);
  const countryName = normalizedCountry
    ? COUNTRY_LABELS[normalizedCountry]
    : toLabel(country);
  const categoryName = toLabel(category);

  return {
    title: `Best ${categoryName} Companies in ${countryName} | Tellacity`,
    description: `Discover the best ${categoryName} companies in ${countryName} based on customer reviews and ratings.`,
  };
}

export default async function BestInCategoryPage(props: PageProps) {
  const { country, category } = await props.params;
  const countryCode = country.toUpperCase();
  const categorySlug = category.trim().toLowerCase();
  const normalizedCountry = normalizeCountryParam(country);
  const storageCountry = normalizedCountry
    ? toStorageCountryCode(normalizedCountry)
    : countryCode;
  const countryName = normalizedCountry
    ? COUNTRY_LABELS[normalizedCountry]
    : toLabel(country);
  const categoryName = toLabel(categorySlug);

  const supabase = createClient();
  const baseQuery = () =>
    supabase
      .from("businesses")
      .select(BUSINESS_LIST_SELECT)
      .eq("status", "active")
      .eq("category_slug", categorySlug);

  const primary = await baseQuery()
    .eq("country_code", storageCountry)
    .order("trust_score", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false })
    .limit(20);

  let businesses = (Array.isArray(primary.data) ? primary.data : []) as BusinessRow[];

  if (businesses.length === 0) {
    const fallbackOne = await baseQuery()
      .eq("country_code", storageCountry)
      .order("review_count", { ascending: false })
      .limit(20);

    businesses = (Array.isArray(fallbackOne.data) ? fallbackOne.data : []) as BusinessRow[];
  }

  if (businesses.length === 0) {
    const fallbackTwo = await baseQuery()
      .order("review_count", { ascending: false })
      .limit(20);

    businesses = (Array.isArray(fallbackTwo.data) ? fallbackTwo.data : []) as BusinessRow[];
  }

  if (businesses.length === 0) {
    const finalFallback = await supabase
      .from("businesses")
      .select(BUSINESS_LIST_SELECT)
      .eq("status", "active")
      .eq("category_slug", categorySlug)
      .limit(20);

    businesses = (Array.isArray(finalFallback.data)
      ? finalFallback.data
      : []) as BusinessRow[];
  }

  const categoryDirectoryHref = `/categories/${categorySlug}?country=${encodeURIComponent(
    storageCountry,
  )}`;

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
          Best {categoryName} companies in {countryName}
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">
          Compare top-rated {categoryName} businesses in {countryName}. Read
          verified reviews and find trusted providers.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            href={categoryDirectoryHref}
            className="font-medium text-[#1FAF9E] hover:underline"
          >
            Open full category directory (filters and sort) →
          </Link>
        </div>

        {businesses.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            No businesses found for this category and country yet.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
              <span>
                Companies ({businesses.length.toLocaleString("en-US")})
              </span>
              <span className="text-gray-400">Leaderboard (highest rated)</span>
            </div>

            <h2 className="mb-3 mt-6 text-lg font-semibold text-[#0E0E0E]">
              Best {categoryName} companies in {countryName}
            </h2>
            <div className="mb-4">
              <CategoryInfoTooltip />
            </div>

            <div className="mt-2 divide-y divide-gray-200 rounded-2xl border border-gray-200">
              {businesses.map((business) => {
                const safeSlug = (business.slug ?? "").trim().toLowerCase();
                if (!isValidSlug(safeSlug)) return null;

                const reviewCount = Number(business.review_count ?? 0) || 0;
                const ratingValue = snapshotRating(business);
                const locationText =
                  formatBusinessAddress(
                    business.address,
                    business.city,
                    business.country_code,
                  ) || "";
                const businessTags = mergeTagsForDisplay(
                  business.tags,
                  business.secondary_category_slugs,
                  business.category_slug,
                );
                const logoUrl = similarBusinessLogoUrl(business);

                return (
                  <Link key={business.id} href={`/b/${safeSlug}`} className="block w-full">
                    <div className="flex flex-col gap-3 px-4 py-5 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#EDEDED] bg-[#FCF7F6]">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={`${sanitizeText(business.name)} logo`}
                              className="h-full w-full object-contain"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-[#0E0E0E]">
                              {(sanitizeText(business.name)?.trim()?.charAt(0) || "B").toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="truncate text-base font-semibold text-[#0E0E0E]">
                              {sanitizeText(business.name)}
                            </div>
                            {reviewCount > 0 && (
                              <img
                                src="/brand/Tellacity%20Vefication%20Batch.png"
                                alt="Tellacity verified reviews"
                                className="h-5 w-5 shrink-0"
                              />
                            )}
                          </div>
                          {business.website && (
                            <div className="truncate text-sm text-gray-500">
                              {sanitizeText(business.website)}
                            </div>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <RatingStars
                              rating={ratingValue}
                              reviewCount={reviewCount}
                              size={12}
                            />
                            <span className="font-medium text-[#0E0E0E]">
                              {ratingValue.toFixed(1)}
                            </span>
                            <span className="text-gray-500">
                              • {reviewCount.toLocaleString("en-US")} reviews
                            </span>
                          </div>
                          {(business.category_slug || businessTags.length > 0) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {business.category_slug && (
                                <span className={businessCategoryPillClassName()}>
                                  {formatBusinessTagLabel(business.category_slug)}
                                </span>
                              )}
                              {businessTags.map((tag, idx) => (
                                <span
                                  key={`${business.id}-${tag}`}
                                  className={businessTagPillClassName(
                                    idx + (business.category_slug ? 1 : 0),
                                  )}
                                >
                                  {formatBusinessTagLabel(tag)}
                                </span>
                              ))}
                            </div>
                          )}
                          {locationText ? (
                            <div className="mt-1 text-xs text-gray-500 sm:hidden">
                              {sanitizeText(locationText)}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {locationText ? (
                        <div className="hidden min-w-[180px] text-right text-sm text-gray-500 sm:block">
                          {sanitizeText(locationText)}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
