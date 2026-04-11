export const revalidate = 60;

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import CategoryClient from "./CategoryClient";
import { normalizeCountryCode } from "@/lib/country";

type PageProps = {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string; country?: string }>;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing for category page");
  }
  return createClient(url, key);
}

// ----------------------------
// METADATA (Next 16 compliant)
// ----------------------------
export async function generateMetadata(props: {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { category_slug } = await props.params;
  const safeCategorySlug = category_slug.trim().toLowerCase();

  const searchParams = (await (props.searchParams ?? Promise.resolve({}))) as {
    page?: string;
    country?: string;
  };

  const pageNum = Math.max(
    1,
    parseInt(String(searchParams.page ?? "1"), 10) || 1
  );
  const supabase = getSupabase();

  let categoryName: string | null = null;

  if (safeCategorySlug) {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", safeCategorySlug)
      .maybeSingle();

    categoryName = data?.name ?? null;
  }

  const fallbackTitle = safeCategorySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const title = categoryName ?? fallbackTitle;
  const baseTitle = `${title} Reviews & Top Rated Companies | Tellacity`;
  const metaTitle = pageNum > 1 ? `${title} Reviews & Top Rated Companies – Page ${pageNum} | Tellacity` : baseTitle;

  return {
    title: metaTitle,
    description: `Browse verified customer reviews for ${title} businesses on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/categories/${safeCategorySlug}`,
    },
  };
}

// ----------------------------
// PAGE (Next 16 compliant)
// ----------------------------
export default async function Page(props: PageProps) {
  const { category_slug } = await props.params;
  const safeCategorySlug = category_slug.trim().toLowerCase();
  const searchParams = (await (props.searchParams ?? Promise.resolve({}))) as {
    page?: string;
    country?: string;
  };
  const pageNum = Math.max(
    1,
    parseInt(String(searchParams.page ?? "1"), 10) || 1
  );
  const supabase = getSupabase();

  const { data: category } = await supabase
    .from("categories")
    .select("slug,name,group_slug")
    .eq("slug", safeCategorySlug)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const categoryName =
    (category.name ?? "").trim() ||
    safeCategorySlug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  const countryCode = normalizeCountryCode(searchParams?.country);
  const countryName =
    countryCode === "US"
      ? "United States"
      : countryCode === "GB"
      ? "United Kingdom"
      : countryCode === "ZA"
      ? "South Africa"
      : countryCode === "AU"
      ? "Australia"
      : countryCode === "CA"
      ? "Canada"
      : countryCode === "NZ"
      ? "New Zealand"
      : countryCode === "IE"
      ? "Ireland"
      : countryCode;

  const businesses: unknown[] = [];
  const companyCount = 0;
  const hasNextPage = false;

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs text-[#1FAF9E]">
            Categories <span className="mx-1">›</span> Business Services <span className="mx-1">›</span> {categoryName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">
            {categoryName} Reviews in {countryName}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Browse verified customer reviews for {categoryName} companies. Compare ratings, read real experiences, and
            find providers that consistently deliver reliable service.
          </p>
          <div className="text-sm text-gray-500 flex flex-wrap gap-4 mt-2">
            <span>• Ranked by TrustScore</span>
            <span>• Filter by rating &amp; country</span>
            <span>• Read &amp; share experiences</span>
          </div>
        </div>
      </section>

      <CategoryClient
        categorySlug={safeCategorySlug}
        initialCountryCode={countryCode}
        businesses={businesses}
        companyCount={companyCount}
        hasNextPage={hasNextPage}
      />
    </>
  );
}
