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
      .select("slug, canonical_slug, updated_at")
      .eq("status", "active")
      .order("id", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Sitemap query error:", error);
      return buildEmptySitemap();
    }

    // Emit `canonical_slug` (brand-clean, e.g. "elite-closing-academy")
    // with `slug` as a fallback. This is the URL form we declare as the
    // canonical in `<link rel="canonical">` from /b/[slug]/page.tsx.
    //
    // History: the route briefly emitted `slug` (city-suffixed, e.g.
    // "elite-closing-academy-newyork") because an OLDER version of the
    // page handler did `permanentRedirect()` from canonical_slug → slug,
    // which caused soft-redirect chains. That redirect was removed; both
    // `/b/<slug>` and `/b/<canonical_slug>` now serve 200 with identical
    // payload and a canonical pointing to canonical_slug. Submitting the
    // canonical form directly skips one Google round-trip per business
    // and matches Google's documented recommendation for canonicalised
    // URL pairs.
    //
    // Junk / placeholder slugs (numeric, "business", "unknown", etc.)
    // are still filtered so we don't dilute the sitemap.
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
        if (!isIndexableSlug(chosen)) return null;
        // Multi-location chains can share the same canonical_slug across
        // siblings; emit it once. `<loc>` URIs in a sitemap should be
        // unique to keep Google's crawl budget clean.
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

