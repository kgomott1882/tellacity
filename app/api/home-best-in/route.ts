import { NextResponse } from "next/server";
import { normalizeCountryCode } from "@/lib/country";
import { HOME_ROTATING_BEST_IN_SLUGS } from "@/lib/homeBestInBundle";
import { loadHomeBestInLive } from "@/lib/loadHomeBestInLive";
import { createSupabaseServerClientForHomeBestIn } from "@/lib/supabase/server";

// Short edge TTL so a newly created review surfaces in the carousel within
// ~30s; stale-while-revalidate keeps latency low under load.
const CACHE_HEADER =
  "public, s-maxage=30, stale-while-revalidate=60, max-age=0";

/**
 * Homepage “Best in …” carousel — LIVE aggregates.
 * Uses `loadHomeBestInLive` (PostgREST on `businesses` + `get_public_review_aggregates`)
 * so `trust_score` + `review_count` reflect current reviews without the bundle RPC timeout.
 * Query: `country` (required).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const country = normalizeCountryCode(url.searchParams.get("country"));

    const supabase = createSupabaseServerClientForHomeBestIn();
    const raw = await loadHomeBestInLive(supabase, country);

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
