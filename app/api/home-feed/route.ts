import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeCountryCode } from "@/lib/country";

/** Enough rows for the homepage Recent reviews carousel (up to 64 shown per country). */
const HOME_FEED_FETCH_LIMIT = 96;

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

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "get_home_feed_for_country",
      {
        p_country_code: country,
        p_limit: HOME_FEED_FETCH_LIMIT,
      } as never
    );

    let rows: Record<string, unknown>[] = [];

    if (!rpcError && Array.isArray(rpcData)) {
      rows = (rpcData as Record<string, unknown>[]).map((row) => ({
        ...row,
        resolved_logo_url:
          typeof row.logo_url === "string" && row.logo_url.trim() !== ""
            ? row.logo_url
            : row.resolved_logo_url ?? null,
      }));
    } else {
      if (rpcError) {
        console.warn("home-feed RPC (using view fallback):", rpcError.message);
      }
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
              "Cache-Control": "no-store",
            },
          }
        );
      }

      rows = (data ?? []) as Record<string, unknown>[];
    }

    const sorted = [...rows].sort((a, b) => {
      const ta = new Date(String(a.created_at ?? 0)).getTime();
      const tb = new Date(String(b.created_at ?? 0)).getTime();
      return tb - ta;
    });

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
