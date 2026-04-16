import type { SupabaseClient } from "@supabase/supabase-js";

/** Matches `/api/home-feed` — enough rows for the homepage carousel. */
export const HOME_PAGE_FEED_FETCH_LIMIT = 96;

/**
 * Loads recent-review rows for the homepage from `home_feed_v2`.
 * Safe with the anon Supabase server client (RLS).
 */
export async function loadHomePageFeedRows(
  supabase: SupabaseClient,
  country: string,
): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from("home_feed_v2")
    .select("*")
    .eq("country_code", (country || "US").toUpperCase())
    .order("created_at", { ascending: false })
    .limit(64);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
