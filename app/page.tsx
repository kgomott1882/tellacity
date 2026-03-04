export const dynamic = "force-dynamic";

import HomePageClient from "./HomePageClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CATEGORY_LABELS: Record<string, string> = {
  banking: "Banking",
  insurance: "Insurance",
  retail: "Retail",
  telecom: "Telecommunications",
};

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

export default async function HomePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const country = searchParams?.country ?? "ZA";

  const supabase = createSupabaseServerClient();

  console.log("HOMEPAGE COUNTRY PARAM:", country);

  const ROTATING_BEST_IN_SLUGS = [
    "banking",
    "insurance",
    "restaurants-and-bars",
    "internet-and-software",
    "banking-and-money",
    "cars-and-trucks",
  ];

  const results = await Promise.all(
    ROTATING_BEST_IN_SLUGS.map(async (slug) => {
      const { data, error } = await supabase.rpc(
        "get_top_businesses_for_category_global",
        {
          p_category_slug: slug,
          p_country_code: country,
          p_min_rating: null,
          p_limit: 8,
          p_offset: 0,
        }
      );

      console.log("BEST-IN RPC", {
        slug,
        country,
        error: error?.message ?? null,
        count: data?.length ?? 0,
      });

      return {
        slug,
        data: (data ?? []) as any[],
        error: error?.message ?? null,
        count: data?.length ?? 0,
      };
    })
  );

  const bestInByCategory: Record<string, any[]> = {};
  const rpcDebug: Record<
    string,
    { country: string; error: string | null; count: number }
  > = {};

  for (const { slug, data, error, count } of results) {
    bestInByCategory[slug] = data;
    rpcDebug[slug] = { country, error, count };
  }

  return (
    <HomePageClient
      initialSelectedCountry={country}
      rotatingCategorySlugs={ROTATING_BEST_IN_SLUGS}
      bestInByCategory={bestInByCategory}
      bestInCategoryLabels={CATEGORY_LABELS}
      rpcDebug={rpcDebug}
    />
  );
}

