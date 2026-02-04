export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabaseClient";

const BASE_URL = "https://tellacity.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categoriesResult, businessesResult] = await Promise.all([
    supabase.from("categories").select("slug"),
    supabase
      .from("businesses")
      .select("slug")
      .eq("status", "active"),
  ]);

  const categorySlugs: string[] =
    (categoriesResult.data ?? [])
      .map((row: { slug?: string | null }) => row.slug)
      .filter((slug): slug is string => typeof slug === "string" && !!slug) ?? [];

  const businessSlugs: string[] =
    (businessesResult.data ?? [])
      .map((row: { slug?: string | null }) => row.slug)
      .filter((slug): slug is string => typeof slug === "string" && !!slug) ?? [];

  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...categorySlugs.map<MetadataRoute.Sitemap[number]>((slug) => ({
      url: `${BASE_URL}/categories/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    })),
    ...businessSlugs.map<MetadataRoute.Sitemap[number]>((slug) => ({
      url: `${BASE_URL}/b/${slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    })),
  ];

  return entries;
}

