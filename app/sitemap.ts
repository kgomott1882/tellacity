export const dynamic = "force-static";

import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { getAllTellacityArticles } from "@/lib/articles/tellacityArticles";
const PAGE_SIZE = 1000;
const SUPPORTED_BEST_COUNTRIES = new Set([
  "US",
  "GB",
  "ZA",
  "AU",
  "CA",
  "NZ",
  "IE",
]);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { count } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const sitemaps: MetadataRoute.Sitemap = [];

  // Paginated business profile sitemaps (discover-first: includes unclaimed listings).
  for (let i = 1; i <= totalPages; i++) {
    sitemaps.push({
      url: `https://tellacity.com/business-sitemaps/${i}.xml`,
      lastModified: new Date(),
    });
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .not("slug", "is", null);
  const existingCategorySlugs = new Set(
    (categories ?? [])
      .map((row) => String((row as { slug?: string }).slug ?? "").trim().toLowerCase())
      .filter(Boolean),
  );

  const ARTICLE_PAGE_SIZE = 1000;
  const { count: articleCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  const articlePages = Math.ceil((articleCount ?? 0) / ARTICLE_PAGE_SIZE) || 0;
  const articleSitemapEntries: MetadataRoute.Sitemap = [
    { url: "https://tellacity.com/articles", lastModified: new Date() },
  ];
  for (let page = 0; page < articlePages; page++) {
    const { data: articleRows } = await supabase
      .from("articles")
      .select("slug, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(page * ARTICLE_PAGE_SIZE, page * ARTICLE_PAGE_SIZE + ARTICLE_PAGE_SIZE - 1);
    for (const row of articleRows ?? []) {
      const slug = String((row as { slug?: string }).slug ?? "").trim();
      if (!slug) continue;
      const lastModRaw =
        (row as { updated_at?: string | null }).updated_at ??
        (row as { published_at?: string | null }).published_at;
      articleSitemapEntries.push({
        url: `https://tellacity.com/articles/${encodeURIComponent(slug)}`,
        lastModified: lastModRaw ? new Date(lastModRaw) : new Date(),
      });
    }
  }

  for (const tellacityArticle of getAllTellacityArticles()) {
    articleSitemapEntries.push({
      url: `https://tellacity.com/articles/${encodeURIComponent(tellacityArticle.slug)}`,
      lastModified: new Date(tellacityArticle.date),
    });
  }

  // /tags/[slug] pages are intentionally NOT submitted in the sitemap.
  // Those routes return `<meta name="robots" content="noindex" />`
  // (see app/tags/[tag_slug]/page.tsx). Submitting noindex URLs in the
  // sitemap is contradictory. Google reports them as
  // "Excluded by 'noindex' tag" in Search Console. Tag pages stay
  // reachable via internal links from category and business pages;
  // they just aren't asked to be crawled here.
  const bestPagePairs = new Set<string>();
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("businesses")
      .select("category_slug,country_code")
      .eq("status", "active")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      break;
    }

    for (const row of data as Array<{ category_slug?: unknown; country_code?: unknown }>) {
      const categorySlug = String(row.category_slug ?? "").trim().toLowerCase();
      if (!categorySlug || !existingCategorySlugs.has(categorySlug)) {
        continue;
      }
      const rawCountry = String(row.country_code ?? "").trim().toUpperCase();
      const bestCountry = rawCountry === "UK" ? "GB" : rawCountry;
      if (!SUPPORTED_BEST_COUNTRIES.has(bestCountry)) {
        continue;
      }
      bestPagePairs.add(`${bestCountry}|${categorySlug}`);
    }

    if (data.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  const bestPages: MetadataRoute.Sitemap = Array.from(bestPagePairs)
    .map((pair) => {
      const [countryCode, categorySlug] = pair.split("|");
      return {
        url: `https://tellacity.com/best/${countryCode.toLowerCase()}/${categorySlug}`,
      };
    })
    .sort((a, b) => a.url.localeCompare(b.url));

  return [
    {
      url: "https://tellacity.com",
    },
    {
      url: "https://tellacity.com/reviews",
    },
    {
      url: "https://tellacity.com/for-business",
    },
    {
      url: "https://tellacity.com/categories",
    },
    {
      url: "https://tellacity.com/companies",
    },
    ...bestPages,
    ...articleSitemapEntries,
    ...sitemaps,
  ];
}
