import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { normalizeCountryCode } from "@/lib/country";
import { loadHomeBestInByCategory } from "@/lib/homeBestInBundle";

const CACHE_HEADER =
  "public, s-maxage=20, stale-while-revalidate=120, max-age=0";

/**
 * Homepage “Best in …” carousel: one HTTP round-trip, same RPC stack as SSR,
 * keyed by `country` like `/api/home-feed` so client + URL stay in sync.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const country = normalizeCountryCode(url.searchParams.get("country"));

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { byCategory, rpcErrors } = await loadHomeBestInByCategory(
      supabase,
      country,
    );

    return NextResponse.json(
      { country, byCategory, rpcErrors },
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
