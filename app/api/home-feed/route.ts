import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCountryCode } from "@/lib/country";
import { loadHomePageFeedRows } from "@/lib/homePageFeedServer";

const CACHE_HEADER =
  "public, s-maxage=20, stale-while-revalidate=120, max-age=0";

/**
 * Public homepage recent reviews: prefer RPC `get_home_feed_for_country` (indexed),
 * fall back to `home_feed_v1` if the RPC is not deployed yet.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const country = normalizeCountryCode(url.searchParams.get("country"));

    const supabase = createSupabaseServerClient();
    const sorted = await loadHomePageFeedRows(supabase, country);

    return NextResponse.json(sorted, {
      headers: {
        "Cache-Control": CACHE_HEADER,
      },
    });
  } catch (e) {
    console.error("home-feed API:", e);
    return NextResponse.json(
      { error: "Failed to load feed", data: [] as unknown[] },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
