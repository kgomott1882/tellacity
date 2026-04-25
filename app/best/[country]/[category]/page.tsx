import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import {
  COUNTRY_LABELS,
  normalizeCountryParam,
  toStorageCountryCode,
} from "@/lib/seoCountries";

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
};

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
      .select("id, name, slug, trust_score, review_count, website")
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
      .select("id, name, slug, trust_score, review_count, website")
      .eq("status", "active")
      .eq("category_slug", categorySlug)
      .limit(20);

    businesses = (Array.isArray(finalFallback.data)
      ? finalFallback.data
      : []) as BusinessRow[];
  }

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
          Best {categoryName} companies in {countryName}
        </h1>

        <p className="mt-4 max-w-3xl text-sm text-gray-600">
          Compare top-rated {categoryName} businesses in {countryName}. Read
          verified reviews and find trusted providers.
        </p>

        {businesses.length === 0 ? (
          <p className="mt-6 text-sm text-gray-500">
            No businesses found for this category and country yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {businesses.map((business) => {
              const slug = (business.slug ?? "").trim().toLowerCase();
              if (!isValidSlug(slug)) {
                return null;
              }

              const name = (business.name ?? "").trim() || "Business";
              const rating = Number(business.trust_score ?? 0) || 0;
              const reviewCount = Number(business.review_count ?? 0) || 0;

              return (
                <li key={business.id}>
                  <Link
                    href={`/b/${slug}`}
                    className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-emerald-500"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-semibold text-[#0E0E0E]">{name}</span>
                      <div className="text-sm text-gray-700">
                        ⭐ {rating ? rating.toFixed(1) : "—"} ({reviewCount || 0} reviews)
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
