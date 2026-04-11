export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import type { BestInBusiness } from "./HomePageClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCountryCode } from "@/lib/country";
import {
  HOME_MARQUEE_CATEGORY_ITEMS,
  buildMarqueeCategoryCards,
  enrichMarqueeItemsWithDbNames,
} from "@/lib/homeMarqueeCategories";
import {
  HOME_ROTATING_BEST_IN_SLUGS,
  loadHomeBestInByCategory,
} from "@/lib/homeBestInBundle";

const CATEGORY_LABELS: Record<string, string> = {
  banking: "Banking",
  insurance: "Insurance",
  retail: "Retail",
  telecom: "Telecommunications",
};

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

type HomeCategoryRow = { id: string; name: string; slug: string };

function HomePageShellFallback() {
  return (
    <main className="bg-white">
      <section
        className="relative min-h-[440px] bg-[#0E0E0E] bg-cover bg-center bg-no-repeat sm:min-h-[520px]"
        style={{
          backgroundImage:
            "url('/brand/Hero%20section-%20Binoculus(1)(1).png')",
        }}
      />
      <section className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        <div className="h-8 w-56 animate-pulse rounded-md bg-gray-200" />
        <p className="mt-4 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
        <div className="mt-8 flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-24 w-24 shrink-0 rounded-2xl border border-gray-100 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="h-8 w-64 animate-pulse rounded-md bg-gray-200" />
        <p className="mt-4 h-4 w-96 max-w-full animate-pulse rounded bg-gray-100" />
        <div className="mt-6 flex gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="h-28 w-24 shrink-0 rounded-2xl bg-gray-50 animate-pulse"
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function buildHomeCategoryRows(
  catRows: { id?: unknown; slug?: unknown; name?: unknown }[] | null | undefined
): HomeCategoryRow[] {
  const out: HomeCategoryRow[] = [];
  for (const r of catRows ?? []) {
    const id = typeof r.id === "string" ? r.id.trim() : "";
    const slug = typeof r.slug === "string" ? r.slug.trim() : "";
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (id && slug && name) out.push({ id, slug, name });
  }
  return out;
}

export default async function HomePage(props: PageProps) {
  let country = "US";
  let bestInByCategory: Record<string, unknown[]> = {};
  let marqueeCategories = buildMarqueeCategoryCards(HOME_MARQUEE_CATEGORY_ITEMS);
  let categoryRowsForHome: HomeCategoryRow[] = [];

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
      try {
        const { data: catRows } = await supabase
          .from("categories")
          .select("id, slug, name")
          .order("name", { ascending: true });
        categoryRowsForHome = buildHomeCategoryRows(catRows);
        const slugSet = new Set(
          (catRows ?? [])
            .map((r) => (r.slug ?? "").trim().toLowerCase())
            .filter(Boolean)
        );
        if (slugSet.size > 0) {
          const filtered = HOME_MARQUEE_CATEGORY_ITEMS.filter((i) =>
            slugSet.has(i.slug.trim().toLowerCase())
          );
          const source =
            filtered.length >= 8 ? filtered : HOME_MARQUEE_CATEGORY_ITEMS;
          const enriched = enrichMarqueeItemsWithDbNames(source, catRows);
          marqueeCategories = buildMarqueeCategoryCards(enriched);
        }
      } catch (marqueeErr) {
        console.error("Homepage marquee categories:", marqueeErr);
      }

      const { byCategory, rpcErrors } = await loadHomeBestInByCategory(
        supabase,
        country
      );
      bestInByCategory = byCategory as unknown as Record<string, unknown[]>;
      for (const slug of HOME_ROTATING_BEST_IN_SLUGS) {
        const err = rpcErrors[slug];
        if (err) {
          console.warn(`[homepage] best-in RPC ${slug}:`, err);
        }
      }
    }
  } catch (error) {
    console.error("Homepage fetch failed:", error);
    country = "US";
    bestInByCategory = {};
    marqueeCategories = buildMarqueeCategoryCards(HOME_MARQUEE_CATEGORY_ITEMS);
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
  const safeRotatingSlugs = [...HOME_ROTATING_BEST_IN_SLUGS];

  try {
    return (
      <Suspense fallback={<HomePageShellFallback />}>
        <HomePageClient
          initialSelectedCountry={country ?? "US"}
          rotatingCategorySlugs={safeRotatingSlugs}
          bestInByCategory={safeBestInByCategory}
          bestInCategoryLabels={safeLabels}
          marqueeCategories={marqueeCategories}
        />
      </Suspense>
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

