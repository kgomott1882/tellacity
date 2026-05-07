import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 1000;

/**
 * Junk/placeholder slugs that occasionally make it through seed imports
 * (e.g. `5`, `business`, `business2`, `unknown`, `unitedstates`). These
 * URLs render but offer no SEO value and dilute the sitemap. Filtering
 * them out keeps the sitemap honest about what we want indexed.
 */
const GARBAGE_SLUG_RE = /^(\d+|business\d*|unknown|unitedstates\d*)$/i;
const MIN_SLUG_LENGTH = 3;

function isIndexableSlug(slug: string | null | undefined): boolean {
  const s = String(slug ?? "").trim().toLowerCase();
  if (s.length < MIN_SLUG_LENGTH) return false;
  if (GARBAGE_SLUG_RE.test(s)) return false;
  return true;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
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
      .select("slug, updated_at")
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Sitemap query error:", error);
      return buildEmptySitemap();
    }

    // Emit each row's actual `slug` (the one whose URL renders 200).
    // Earlier the route emitted `canonical_slug || slug`, which produced
    // sitemap URLs that didn't exist as their own row and triggered a
    // soft-redirect chain when Google crawled them. Rows with junk or
    // missing slugs are skipped so we don't pollute Google's view of
    // site quality.
    const urls = (data || [])
      .filter((b) => isIndexableSlug((b as { slug?: string | null }).slug))
      .map((b) => {
        const slug = String((b as { slug?: string | null }).slug ?? "").trim().toLowerCase();
        const updatedAt = (b as { updated_at?: string | null }).updated_at;
        return `
  <url>
    <loc>https://tellacity.com/b/${slug}</loc>
    <lastmod>${new Date(updatedAt || Date.now()).toISOString()}</lastmod>
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

