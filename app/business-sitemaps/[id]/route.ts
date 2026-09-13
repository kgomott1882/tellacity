import { NextResponse } from "next/server";
import {
  BUSINESS_SITEMAP_PAGE_SIZE,
} from "@/lib/businessIndexability";
import { listSitemapEligibleBusinessesPage } from "@/lib/businessSitemap";

export const runtime = "edge";
export const revalidate = 3600;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const page = parseInt(params.id || "1", 10);

    if (isNaN(page) || page < 1) {
      return buildEmptySitemap();
    }

    const rows = await listSitemapEligibleBusinessesPage(
      page,
      BUSINESS_SITEMAP_PAGE_SIZE,
    );

    const urls = rows
      .map((b) => {
        return `
  <url>
    <loc>https://tellacity.com/b/${encodeURIComponent(b.slug)}</loc>
    <lastmod>${new Date(b.updated_at || Date.now()).toISOString()}</lastmod>
  </url>`;
      })
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Sitemap fatal error:", err);
    return buildEmptySitemap();
  }
}

function buildEmptySitemap() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
