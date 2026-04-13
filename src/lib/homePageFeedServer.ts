import type { SupabaseClient } from "@supabase/supabase-js";

/** Matches `/api/home-feed` — enough rows for the homepage carousel. */
export const HOME_PAGE_FEED_FETCH_LIMIT = 96;

/**
 * Loads recent-review rows for the homepage (same RPC + view fallback as GET /api/home-feed).
 * Safe with the anon Supabase server client (RLS).
 */
export async function loadHomePageFeedRows(
  supabase: SupabaseClient,
  country: string,
): Promise<Record<string, unknown>[]> {
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "get_home_feed_for_country",
    {
      p_country_code: country,
      p_limit: HOME_PAGE_FEED_FETCH_LIMIT,
    } as never,
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
    const { data, error } = await supabase
      .from("home_feed_v1")
      .select("*")
      .ilike("country_code", country)
      .order("created_at", { ascending: false })
      .limit(HOME_PAGE_FEED_FETCH_LIMIT);

    if (error) {
      throw new Error(error.message);
    }
    rows = (data ?? []) as Record<string, unknown>[];
  }

  return [...rows].sort((a, b) => {
    const ta = new Date(String(a.created_at ?? 0)).getTime();
    const tb = new Date(String(b.created_at ?? 0)).getTime();
    return tb - ta;
  });
}
