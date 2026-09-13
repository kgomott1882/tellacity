import type { NextRequest } from "next/server";
import {
  businessSitemapShardCount,
  countSitemapEligibleBusinesses,
} from "@/lib/businessSitemap";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";

export const revalidate = 3600;

/**
 * Sitemap index linked from robots.txt.
 * Shard count is dynamic from SEO-quality eligible businesses (no hard 40 cap).
 */
export async function GET(_request: NextRequest) {
  const eligible = await countSitemapEligibleBusinesses();
  const shards = businessSitemapShardCount(eligible);
  const sitemaps: string[] = [];

  for (let i = 1; i <= shards; i++) {
    const loc = `${BASE_URL}/business-sitemaps/${i}.xml`;
    sitemaps.push(`<sitemap>\n  <loc>${loc}</loc>\n</sitemap>`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${sitemaps.join("\n\n")}

</sitemapindex>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
