import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCountryCode } from "@/lib/country";

const CACHE_HEADER =
  "public, s-maxage=20, stale-while-revalidate=120, max-age=0";

/**
 * Public homepage recent reviews from `home_feed_v2`.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const country = normalizeCountryCode(url.searchParams.get("country"));

    const supabase = createSupabaseServerClient();
    // Must mirror `loadHomePageFeedRows` (64) so the client country-switch
    // refetch in HomePageClient doesn't shrink the carousel from 64 → 16 rows.
    const supabaseRes = await supabase
      .from("home_feed_v2")
      .select("*")
      .eq("country_code", country)
      .order("created_at", { ascending: false })
      .limit(64);
    const { data, error } = supabaseRes;

    if (error) {
      throw new Error(error.message);
    }

    console.log("HOME FEED SOURCE: home_feed_v2", data?.length);

    return NextResponse.json(data, {
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
