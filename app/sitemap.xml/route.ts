import type { NextRequest } from "next/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";
const MAX_SHARDS = 40;

export async function GET(_request: NextRequest) {
  const sitemaps: string[] = [];

  for (let i = 1; i <= MAX_SHARDS; i++) {
    const loc = `${BASE_URL}/business-sitemaps/${i}.xml`;
    sitemaps.push(
      `<sitemap>\n  <loc>${loc}</loc>\n</sitemap>`
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n\n${sitemaps.join(
    "\n\n"
  )}\n\n</sitemapindex>`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

