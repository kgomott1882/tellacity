export const revalidate = 60;

import { createClient } from "@supabase/supabase-js";
import CategoryClient from "./CategoryClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ----------------------------
// METADATA (Next 16 compliant)
// ----------------------------
export async function generateMetadata(props: {
  params: Promise<{ category_slug: string }>;
}) {
  const { category_slug } = await props.params;

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

  return {
    title: `Best in ${title} | Tellacity`,
    description: `Browse verified customer reviews for ${title} businesses on Tellacity.`,
  };
}

// ----------------------------
// PAGE (Next 16 compliant)
// ----------------------------
export default async function CategoryPage(props: {
  params: Promise<{ category_slug: string }>;
  searchParams: Promise<{ country?: string }>;
}) {
  const { category_slug } = await props.params;
  const searchParams = await props.searchParams;

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
      : Number(countData ?? 0) || 0;

  const hasNextPage = companyCount > 10;

  return (
    <CategoryClient
      categorySlug={category_slug}
      initialCountryCode={countryCode}
      businesses={businesses}
      companyCount={companyCount}
      hasNextPage={hasNextPage}
    />
  );
}
