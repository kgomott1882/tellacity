export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCountryCode } from "@/lib/country";

/** Enough rows for the homepage Recent reviews carousel (up to 64 shown per country). */
const HOME_FEED_FETCH_LIMIT = 96;

/**
 * Public homepage recent reviews — `home_feed_v1` filtered by business country (same idea as Best-in RPC).
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const country = normalizeCountryCode(url.searchParams.get("country"));

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("home_feed_v1")
      .select("*")
      .ilike("country_code", country)
      .order("created_at", { ascending: false })
      .limit(HOME_FEED_FETCH_LIMIT);

    if (error) {
      console.error("home-feed API:", error.message);
      return NextResponse.json(
        { error: error.message, data: [] as unknown[] },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );
    }

    const rows = [...(data ?? [])].sort((a, b) => {
      const ra = a as Record<string, unknown>;
      const rb = b as Record<string, unknown>;
      const ta = new Date(String(ra.created_at ?? 0)).getTime();
      const tb = new Date(String(rb.created_at ?? 0)).getTime();
      return tb - ta;
    });

    return NextResponse.json(rows, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    console.error("home-feed API:", e);
    return NextResponse.json(
      { error: "Failed to load feed", data: [] as unknown[] },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      },
    );
  }
}
