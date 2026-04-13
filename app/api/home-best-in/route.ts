import { NextResponse } from "next/server";
import { normalizeCountryCode } from "@/lib/country";
import { HOME_ROTATING_BEST_IN_SLUGS } from "@/lib/homeBestInBundle";
import { loadHomeBestInFromCache } from "@/lib/loadHomeBestInFromCache";
import { createSupabaseServerClientForHomeBestIn } from "@/lib/supabase/server";

const CACHE_HEADER =
  "public, s-maxage=300, stale-while-revalidate=600, max-age=0";

/**
 * Homepage “Best in …” carousel from `home_best_in_cache`. Query: `country` (required).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const country = normalizeCountryCode(url.searchParams.get("country"));

    const supabase = createSupabaseServerClientForHomeBestIn();
    const raw = await loadHomeBestInFromCache(supabase, country);

    const byCategory: Record<string, unknown[]> = {};
    for (const slug of HOME_ROTATING_BEST_IN_SLUGS) {
      const v = raw[slug];
      byCategory[slug] = Array.isArray(v) ? v : [];
    }

    return NextResponse.json(
      { country, byCategory, rpcErrors: {} },
      {
        headers: {
          "Cache-Control": CACHE_HEADER,
        },
      },
    );
  } catch (e) {
    console.error("home-best-in API:", e);
    return NextResponse.json(
      { error: "Failed to load best-in", country: "US", byCategory: {} },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
