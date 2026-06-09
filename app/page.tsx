export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Suspense } from "react";
import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { HomeLatestArticlesSkeleton } from "@/components/home/HomeLatestArticles";
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
import { getLatestArticles, type HubArticleCard } from "@/lib/articles/hubArticles";

const CATEGORY_LABELS: Record<string, string> = {
  banking: "Banking",
  insurance: "Insurance",
  retail: "Retail",
  telecom: "Telecommunications",
};

const COUNTRY_LABELS: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  AU: "Australia",
  NZ: "New Zealand",
  IE: "Ireland",
  ZA: "South Africa",
};

const COUNTRY_LANGUAGES: Record<string, string> = {
  US: "en-US",
  GB: "en-GB",
  CA: "en-CA",
  AU: "en-AU",
  NZ: "en-NZ",
  IE: "en-IE",
  ZA: "en-ZA",
};

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

function readCountryFromSearchParams(
  raw: string | string[] | undefined,
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return normalizeCountryCode(value);
}

/** True only when `?country=...` is actually present in the URL with a non-empty value. */
function hasExplicitCountryParam(
  raw: string | string[] | undefined,
): boolean {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Canonical URL for SEO. `?country=US` consolidates back to the global home
 * to avoid duplicate-content; every other explicit country gets its own
 * canonical URL.
 */
function homeCanonicalUrl(countryCode: string): string {
  return countryCode === "US"
    ? "https://tellacity.com/"
    : `https://tellacity.com/?country=${countryCode}`;
}

/**
 * Actual URL of the rendered page for use in WebPage JSON-LD. Differs from
 * the canonical because `/?country=US` should describe itself, not the
 * global home it canonicalizes to.
 */
function homePageJsonLdUrl(countryCode: string): string {
  return `https://tellacity.com/?country=${countryCode}`;
}

const GLOBAL_HOME_TITLE =
  "Customer Reviews & Feedback for Businesses Worldwide | Tellacity";
const GLOBAL_HOME_DESCRIPTION =
  "Read and write real customer reviews for businesses worldwide. Discover trusted feedback, verified reviews, and business insights on Tellacity.";
const GLOBAL_HOME_CANONICAL = "https://tellacity.com/";

export async function generateMetadata(
  props: PageProps,
): Promise<Metadata> {
  let countryCode = "US";
  let isGlobal = true;
  try {
    const searchParams = await props.searchParams;
    isGlobal = !hasExplicitCountryParam(searchParams?.country);
    countryCode = readCountryFromSearchParams(searchParams?.country);
  } catch {
    countryCode = "US";
    isGlobal = true;
  }

  if (isGlobal) {
    return {
      title: GLOBAL_HOME_TITLE,
      description: GLOBAL_HOME_DESCRIPTION,
      alternates: { canonical: GLOBAL_HOME_CANONICAL },
      openGraph: {
        title: GLOBAL_HOME_TITLE,
        description: GLOBAL_HOME_DESCRIPTION,
        url: GLOBAL_HOME_CANONICAL,
        siteName: "Tellacity",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: GLOBAL_HOME_TITLE,
        description: GLOBAL_HOME_DESCRIPTION,
      },
      robots: { index: true, follow: true },
    };
  }

  const countryName = COUNTRY_LABELS[countryCode] ?? "United States";
  const canonical = homeCanonicalUrl(countryCode);
  const title = `Customer Reviews & Feedback for ${countryName} Businesses | Tellacity`;
  const description = `Read and write real customer reviews for ${countryName} businesses. Discover trusted feedback, verified reviews, and business insights on Tellacity.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Tellacity",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

type HomeCategoryRow = { id: string; name: string; slug: string };

function HomePageShellFallback() {
  return (
    <main className="home-cinematic bg-[#0E0E0E]">
      <section
        className="home-hero relative min-h-[min(720px,82dvh)] bg-[#0E0E0E]"
        aria-hidden
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
      <HomeLatestArticlesSkeleton />
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
  let isGlobalHome = true;
  let webPageJsonLd: Record<string, unknown> = {};
  let rawCountrySearchParam: string | string[] | undefined;
  try {
    const sp = await props.searchParams;
    rawCountrySearchParam = sp?.country;
    isGlobalHome = !hasExplicitCountryParam(rawCountrySearchParam);
    country = readCountryFromSearchParams(rawCountrySearchParam);

    if (isGlobalHome) {
      webPageJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: GLOBAL_HOME_TITLE,
        description:
          "Browse and write verified customer reviews for businesses around the world on Tellacity.",
        url: GLOBAL_HOME_CANONICAL,
        inLanguage: "en",
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://tellacity.com/",
            },
          ],
        },
      };
    } else {
      const ccName = COUNTRY_LABELS[country] ?? "United States";
      const ccLang = COUNTRY_LANGUAGES[country] ?? "en-US";
      const ccPageUrl = homePageJsonLdUrl(country);
      webPageJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Customer Reviews & Feedback for ${ccName} Businesses | Tellacity`,
        description: `Browse and write verified customer reviews for ${ccName} businesses on Tellacity.`,
        url: ccPageUrl,
        inLanguage: ccLang,
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://tellacity.com/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: ccName,
              item: ccPageUrl,
            },
          ],
        },
      };
    }
  } catch {
    webPageJsonLd = {};
    isGlobalHome = true;
  }
  let bestInByCategory: Record<string, unknown[]> = {};
  let homeFeedRows: Record<string, unknown>[] = [];
  let latestArticles: HubArticleCard[] = [];
  let marqueeCategories = buildMarqueeCategoryCards(HOME_MARQUEE_CATEGORY_ITEMS);
  let categoryRowsForHome: HomeCategoryRow[] = [];

  try {

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      console.error("Homepage fetch failed: Supabase client is null");
    } else {
      try {
        const [{ data: catRows }, rawBestIn, feedRows, latestArticlesResult] =
          await Promise.all([
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
          getLatestArticles(createSupabaseServerClientForHomeBestIn(), 4).catch(
            (err) => {
              console.error("Homepage latest articles:", err);
              return [] as HubArticleCard[];
            },
          ),
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
        latestArticles = Array.isArray(latestArticlesResult) ? latestArticlesResult : [];
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
        {Object.keys(webPageJsonLd).length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(webPageJsonLd),
            }}
          />
        )}
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
            initialIsGlobalHome={isGlobalHome}
            rotatingCategorySlugs={safeRotatingSlugs}
            bestInByCategory={safeBestInByCategory}
            bestInCategoryLabels={safeLabels}
            marqueeCategories={marqueeCategories}
            initialHomeFeedRows={homeFeedRows}
            initialLatestArticles={latestArticles}
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
        {Object.keys(webPageJsonLd).length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(webPageJsonLd),
            }}
          />
        )}
        <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Tellacity</h1>
          <p className="mt-2 text-gray-600">Customer Reviews &amp; Feedback</p>
        </main>
      </>
    );
  }
}

