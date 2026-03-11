import type { NextRequest } from "next/server";

import { supabaseServer } from "@/lib/supabaseServer";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";
const SHARD_SIZE = 10000;

type BusinessRow = {
  slug: string | null;
  updated_at?: string | null;
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const shardIndex = parseInt(rawId, 10);

  if (!Number.isFinite(shardIndex) || shardIndex < 1) {
    return new Response("Not found", { status: 404 });
  }

  const offset = (shardIndex - 1) * SHARD_SIZE;

  const { data, error } = await supabaseServer
    .from("businesses")
    .select("slug, updated_at")
    .eq("status", "active")
    .not("slug", "is", null)
    .order("id", { ascending: true })
    .range(offset, offset + SHARD_SIZE - 1);

  if (error) {
    return new Response("Error loading sitemap", { status: 500 });
  }

  const rows = (Array.isArray(data) ? data : []) as BusinessRow[];

  const urls = rows
    .filter((row) => row.slug)
    .map((row) => {
      const slug = String(row.slug);
      const loc = `${BASE_URL}/b/${encodeURIComponent(slug)}`;
      const lastmod = row.updated_at
        ? new Date(row.updated_at).toISOString()
        : null;

      return lastmod
        ? `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
        : `<url><loc>${loc}</loc></url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

