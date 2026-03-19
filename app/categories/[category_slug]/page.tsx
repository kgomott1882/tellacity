export const revalidate = 60;

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";
import CategoryClient from "./CategoryClient";

type PageProps = {
  params: Promise<{ category_slug: string }>;
  searchParams?: Promise<{ page?: string; country?: string }>;
};

type RelatedCategoryLink = { slug: string; label: string };

const RELATED_CATEGORIES_BY_GROUP: Record<string, RelatedCategoryLink[]> = {
  automotive: [
    { slug: "car-dealers", label: "Car Dealers" },
    { slug: "auto-repair", label: "Auto Repair" },
    { slug: "car-rental", label: "Car Rental" },
    { slug: "auto-insurance", label: "Auto Insurance" },
  ],
  retail: [
    { slug: "online-shopping", label: "Online Shopping" },
    { slug: "fashion-retail", label: "Fashion Retail" },
    { slug: "electronics-retail", label: "Electronics Retail" },
    { slug: "home-goods-retail", label: "Home Goods Retail" },
  ],
  financial: [
    { slug: "banks", label: "Banks" },
    { slug: "insurance", label: "Insurance" },
    { slug: "lenders", label: "Lenders" },
    { slug: "payment-services", label: "Payment Services" },
  ],
  technology: [
    { slug: "software-companies", label: "Software Companies" },
    { slug: "internet-providers", label: "Internet Providers" },
    { slug: "web-hosting", label: "Web Hosting" },
    { slug: "saas-platforms", label: "SaaS Platforms" },
  ],
  home: [
    { slug: "home-services", label: "Home Services" },
    { slug: "moving-services", label: "Moving Services" },
    { slug: "cleaning-services", label: "Cleaning Services" },
    { slug: "security-services", label: "Security Services" },
  ],
  default: [
    { slug: "business-services", label: "Business Services" },
    { slug: "online-shopping", label: "Online Shopping" },
    { slug: "home-services", label: "Home Services" },
    { slug: "technology-services", label: "Technology Services" },
  ],
};

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

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

  if (category_slug) {
    const { data } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", category_slug)
      .maybeSingle();

    categoryName = data?.name ?? null;
  }

  const fallbackTitle = category_slug
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
    .eq("slug", category_slug)
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
  const groupKey = String(category.group_slug ?? "")
    .trim()
    .toLowerCase();
  const relatedCategoryLinks = (RELATED_CATEGORIES_BY_GROUP[groupKey] ?? RELATED_CATEGORIES_BY_GROUP.default)
    .filter((item) => {
      const safeSlug = item.slug.trim().toLowerCase();
      return isValidSlug(safeSlug) && safeSlug !== safeCategorySlug;
    })
    .slice(0, 4);

  const countryCode = searchParams?.country ?? "ZA";

  const { data: businessesData } = await supabase.rpc(
    "get_top_businesses_for_category_global",
    {
      p_category_slug: category_slug,
      p_country_code: countryCode,
      p_min_rating: null,
      p_limit: 10,
      p_offset: 0,
    }
  );

  const businesses = Array.isArray(businessesData)
    ? businessesData
    : [];

  const { data: countData } = await supabase.rpc(
        "get_category_business_count",
        {
      p_category_slug: category_slug,
      p_country_code: countryCode,
      p_min_rating: null,
    }
  );

  const companyCount =
    typeof countData === "number"
      ? countData
      : (Number(countData ?? 0)) || 0;

  const hasNextPage = companyCount > 10;

  return (
    <>
      <section className="mx-auto w-full max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E]">{categoryName}</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Explore trusted businesses in {categoryName.toLowerCase()} and compare real customer experiences before you
            decide. This page highlights top-rated options and recent feedback to help you choose confidently.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Use the listings below to review ratings, read comments, and find providers that consistently deliver good
            service.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#0E0E0E]">What to look for in {categoryName}</h2>
              <p className="mt-2 text-sm text-gray-600">
                Focus on review consistency, response quality, and whether businesses resolve issues clearly. Reliable
                providers usually show strong service patterns over time, not just isolated high ratings.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#0E0E0E]">Common issues customers report</h2>
              <p className="mt-2 text-sm text-gray-600">
                Customers often mention communication delays, billing confusion, and uneven service quality. Compare
                how each business responds to these concerns - that usually reflects long-term reliability.
              </p>
            </div>
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

      {relatedCategoryLinks.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">Explore related categories</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCategoryLinks.map((item) => (
              <Link
                key={item.slug}
                href={`/categories/${item.slug}`}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0E0E0E] transition hover:border-[#1FAF9E] hover:bg-[#F8FFFE]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
