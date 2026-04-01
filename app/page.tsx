export const dynamic = "force-dynamic";

import Link from "next/link";
import HomePageClient from "./HomePageClient";
import type { BestInBusiness } from "./HomePageClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { comparisonLinks } from "@/lib/comparisonLinks";
import { normalizeCountryCode } from "@/lib/country";

const CATEGORY_LABELS: Record<string, string> = {
  banking: "Banking",
  insurance: "Insurance",
  retail: "Retail",
  telecom: "Telecommunications",
};

const ROTATING_BEST_IN_SLUGS = [
  "banking",
  "insurance",
  "restaurants-and-bars",
  "internet-and-software",
  "banking-and-money",
  "cars-and-trucks",
];

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

export default async function HomePage(props: PageProps) {
  let country = "US";
  let bestInByCategory: Record<string, unknown[]> = {};
  let rpcDebug: Record<
    string,
    { country: string; error: string | null; count: number }
  > = {};

  try {
    const searchParams = await props.searchParams;
    const rawCountry = searchParams?.country;
    const countryParam = Array.isArray(rawCountry)
      ? rawCountry[0]
      : rawCountry;
    country = normalizeCountryCode(countryParam);

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      console.error("Homepage fetch failed: Supabase client is null");
    } else {
      console.log("HOMEPAGE COUNTRY PARAM:", country);

      const results = await Promise.all(
        (Array.isArray(ROTATING_BEST_IN_SLUGS) ? ROTATING_BEST_IN_SLUGS : []).map(
          async (slug) => {
            try {
              const { data, error } = await supabase.rpc(
                "get_top_businesses_for_category_global",
                {
                  p_category_slug: slug,
                  p_country_code: country,
                  p_min_rating: null,
                  p_limit: 24,
                  p_offset: 0,
                }
              );

              console.log("BEST-IN RPC", {
                slug,
                country,
                error: error?.message ?? null,
                count: Array.isArray(data) ? data.length : 0,
              });

              return {
                slug,
                data: (Array.isArray(data) ? data : []) as unknown[],
                error: error?.message ?? null,
                count: Array.isArray(data) ? data.length : 0,
              };
            } catch (rpcError) {
              console.error("Homepage fetch failed:", rpcError);
              return {
                slug,
                data: [] as unknown[],
                error:
                  rpcError instanceof Error ? rpcError.message : String(rpcError),
                count: 0,
              };
            }
          }
        )
      );

      for (const item of Array.isArray(results) ? results : []) {
        const slug = item?.slug;
        const data = item?.data;
        const err = item?.error ?? null;
        const count = typeof item?.count === "number" ? item.count : 0;
        if (slug != null && typeof slug === "string") {
          bestInByCategory[slug] = Array.isArray(data) ? data : [];
          rpcDebug[slug] = { country, error: err, count };
        }
      }
    }
  } catch (error) {
    console.error("Homepage fetch failed:", error);
    country = "US";
    bestInByCategory = {};
    rpcDebug = {};
  }

  const safeBestInByCategory: Record<string, BestInBusiness[]> = {};
  Object.entries(bestInByCategory ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      safeBestInByCategory[key] = value as BestInBusiness[];
    } else {
      safeBestInByCategory[key] = [];
    }
  });

  const safeLabels: Record<string, string> = CATEGORY_LABELS ?? {};
  const safeRpcDebug: Record<
    string,
    { country: string; error: string | null; count: number }
  > = rpcDebug ?? {};
  const safeRotatingSlugs = Array.isArray(ROTATING_BEST_IN_SLUGS)
    ? ROTATING_BEST_IN_SLUGS
    : [];

  try {
    return (
      <HomePageClient
        initialSelectedCountry={country ?? "US"}
        rotatingCategorySlugs={safeRotatingSlugs}
        bestInByCategory={safeBestInByCategory}
        bestInCategoryLabels={safeLabels}
        rpcDebug={safeRpcDebug}
      />
    );
  } catch (renderError) {
    console.error("Homepage render failed:", renderError);
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Tellacity</h1>
        <p className="mt-2 text-gray-600">Customer Reviews &amp; Feedback</p>
      </main>
    );
  }
}

