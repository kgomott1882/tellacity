export const dynamic = "force-static";

import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SUPPORTED_COUNTRY_CODES, countryPathSegment } from "@/lib/seoCountries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/best`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/top-rated`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/for-business`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms-of-service`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/companies`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  for (const code of SUPPORTED_COUNTRY_CODES) {
    const segment = countryPathSegment(code);
    pages.push({
      url: `${BASE_URL}/companies/${segment}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  const supabase = createClient();

  const { data: groups } = await supabase
    .from("category_groups")
    .select("group_slug, slug")
    .order("name", { ascending: true });

  const groupSlugs = (Array.isArray(groups) ? groups : []) as { group_slug?: string | null; slug?: string | null }[];
  for (const g of groupSlugs) {
    const slug = g.group_slug ?? g.slug;
    if (slug) {
      pages.push({
        url: `${BASE_URL}/best/${encodeURIComponent(slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .order("name", { ascending: true });

  const categorySlugs = (Array.isArray(categories) ? categories : []) as { slug: string | null }[];
  for (const c of categorySlugs) {
    if (c.slug) {
      pages.push({
        url: `${BASE_URL}/best/${encodeURIComponent(c.slug)}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const { count: businessCount } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .in("status", ["active", "ok"])
    .not("slug", "is", null);

  if (typeof businessCount === "number" && businessCount > 0) {
    const SHARD_SIZE = 10000;
    const shardTotal = Math.ceil(businessCount / SHARD_SIZE);
    for (let i = 1; i <= shardTotal; i++) {
      pages.push({
        url: `${BASE_URL}/business-sitemaps/${i}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.4,
      });
    }
  }

  return pages;
}
