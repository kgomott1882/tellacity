export const dynamic = "force-static";

import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
const PAGE_SIZE = 1000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { count } = await supabase
    .from("businesses")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const sitemaps: MetadataRoute.Sitemap = [];

  for (let i = 1; i <= totalPages; i++) {
    sitemaps.push({
      url: `https://tellacity.com/business-sitemaps/${i}.xml`,
      lastModified: new Date(),
    });
  }

  return sitemaps;
}
