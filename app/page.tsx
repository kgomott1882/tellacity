export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata = {
  title: "Tellacity Reviews | Customer Reviews & Trusted Business Feedback",
  description:
    "Discover and share real customer reviews across 200,000+ businesses worldwide. Tellacity helps you make informed decisions with trusted feedback and ratings.",
  alternates: {
    canonical: "https://tellacity.com",
  },
  openGraph: {
    title: "Tellacity Reviews | Customer Reviews & Trusted Business Feedback",
    description:
      "Discover and share real customer reviews across 200,000+ businesses worldwide.",
    url: "https://tellacity.com",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tellacity Reviews",
    description: "Read and write real customer reviews on Tellacity.",
  },
};

import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import type { BestInBusiness } from "./HomePageClient";
import {
  createSupabaseServerClient,
  createSupabaseServerClientForHomeBestIn,
} from "@/lib/supabase/server";
import { normalizeCountryCode } from "@/lib/country";
import {
  HOME_MARQUEE_CATEGORY_ITEMS,
  buildMarqueeCategoryCards,
  enrichMarqueeItemsWithDbNames,
} from "@/lib/homeMarqueeCategories";
import { HOME_ROTATING_BEST_IN_SLUGS } from "@/lib/homeBestInBundle";
import { loadHomeBestInLive } from "@/lib/loadHomeBestInLive";
import { loadHomePageFeedRows } from "@/lib/homePageFeedServer";

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
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tellacity",
    url: "https://tellacity.com",
    sameAs: [],
  };
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tellacity",
    url: "https://tellacity.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://tellacity.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  let country = "US";
  let bestInByCategory: Record<string, unknown[]> = {};
  let homeFeedRows: Record<string, unknown>[] = [];
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
        const [{ data: catRows }, rawBestIn, feedRows] = await Promise.all([
          supabase
            .from("categories")
            .select("id, slug, name")
            .order("name", { ascending: true }),
          loadHomeBestInLive(
            createSupabaseServerClientForHomeBestIn(),
            country,
          ),
          loadHomePageFeedRows(supabase, country).catch((err) => {
            console.error("Homepage home feed:", err);
            return [] as Record<string, unknown>[];
          }),
        ]);
        categoryRowsForHome = buildHomeCategoryRows(catRows);
        const slugSet = new Set(
          (catRows ?? [])
            .map((r) => (r.slug ?? "").trim().toLowerCase())
            .filter(Boolean),
        );
        if (slugSet.size > 0) {
          const filtered = HOME_MARQUEE_CATEGORY_ITEMS.filter((i) =>
            slugSet.has(i.slug.trim().toLowerCase()),
          );
          const source =
            filtered.length >= 8 ? filtered : HOME_MARQUEE_CATEGORY_ITEMS;
          const enriched = enrichMarqueeItemsWithDbNames(source, catRows);
          marqueeCategories = buildMarqueeCategoryCards(enriched);
        }
        const mergedBestIn: Record<string, unknown[]> = {};
        for (const slug of HOME_ROTATING_BEST_IN_SLUGS) {
          const v = rawBestIn[slug];
          mergedBestIn[slug] = Array.isArray(v) ? v : [];
        }
        bestInByCategory = mergedBestIn;
        homeFeedRows = Array.isArray(feedRows) ? feedRows : [];
      } catch (marqueeErr) {
        console.error("Homepage marquee / best-in:", marqueeErr);
      }
    }
  } catch (error) {
    console.error("Homepage fetch failed:", error);
    country = "US";
    bestInByCategory = {};
    homeFeedRows = [];
    marqueeCategories = buildMarqueeCategoryCards(HOME_MARQUEE_CATEGORY_ITEMS);
  }

  const safeBestInByCategory: Record<string, BestInBusiness[]> = {};
  for (const slug of HOME_ROTATING_BEST_IN_SLUGS) {
    const value = (bestInByCategory ?? {})[slug];
    safeBestInByCategory[slug] = Array.isArray(value)
      ? (value as BestInBusiness[])
      : [];
  }

  const safeLabels: Record<string, string> = CATEGORY_LABELS ?? {};
  const safeRotatingSlugs = [...HOME_ROTATING_BEST_IN_SLUGS];
  try {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <Suspense fallback={<HomePageShellFallback />}>
          {/*
           * IMPORTANT: do NOT add `key={country}` here.
           * HomePageClient handles country switches client-side (re-fetches
           * `/api/home-best-in` and `/api/home-feed`). Keying on `country`
           * would unmount/remount the whole page on every dropdown change,
           * resetting carousels, scroll positions, and reintroducing the
           * empty-state flicker the user reported.
           */}
          <HomePageClient
            initialSelectedCountry={country ?? "US"}
            rotatingCategorySlugs={safeRotatingSlugs}
            bestInByCategory={safeBestInByCategory}
            bestInCategoryLabels={safeLabels}
            marqueeCategories={marqueeCategories}
            initialHomeFeedRows={homeFeedRows}
          />
        </Suspense>
      </>
    );
  } catch (renderError) {
    console.error("Homepage render failed:", renderError);
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Tellacity</h1>
          <p className="mt-2 text-gray-600">Customer Reviews &amp; Feedback</p>
        </main>
      </>
    );
  }
}

