import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isIndexableBusinessSlug } from "@/lib/businessIndexability";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const PAGE_SIZE = 1000;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const params = await context.params;
  try {
    const page = parseInt(params.id || "1", 10);

    if (isNaN(page) || page < 1) {
      return buildEmptySitemap();
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("businesses")
      .select("slug, canonical_slug, updated_at")
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Sitemap query error:", error);
      return buildEmptySitemap();
    }

    const seenSlugs = new Set<string>();
    const urls = (data || [])
      .map((b) => {
        const rawCanonical = String(
          (b as { canonical_slug?: string | null }).canonical_slug ?? "",
        )
          .trim()
          .toLowerCase();
        const rawSlug = String((b as { slug?: string | null }).slug ?? "")
          .trim()
          .toLowerCase();
        const chosen = rawCanonical || rawSlug;
        if (!isIndexableBusinessSlug(chosen)) return null;
        if (seenSlugs.has(chosen)) return null;
        seenSlugs.add(chosen);
        const updatedAt = (b as { updated_at?: string | null }).updated_at;
        return `
  <url>
    <loc>https://tellacity.com/b/${chosen}</loc>
    <lastmod>${new Date(updatedAt || Date.now()).toISOString()}</lastmod>
  </url>`;
      })
      .filter(Boolean)
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml",
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
