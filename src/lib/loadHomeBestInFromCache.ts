import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Homepage “Best in …” from `home_best_in_cache` (one row per country + category).
 * On error or empty table returns `{}` (no RPC fallback). Callers merge with
 * `HOME_ROTATING_BEST_IN_SLUGS` so each slug resolves to an array.
 */
export async function loadHomeBestInFromCache(
  supabase: SupabaseClient,
  country: string,
): Promise<Record<string, unknown[]>> {
  const { data, error } = await supabase
    .from("home_best_in_cache")
    .select("category_slug, businesses")
    .eq("country_code", country);

  if (error) {
    console.error("Best in cache error:", error);
    return {};
  }

  if (!data || data.length === 0) {
    return {};
  }

  const result: Record<string, unknown[]> = {};

  for (const row of data) {
    const r = row as { category_slug?: unknown; businesses?: unknown };
    const slug = String(r.category_slug ?? "").trim().toLowerCase();
    if (!slug) continue;
    result[slug] = Array.isArray(r.businesses) ? r.businesses : [];
  }

  return result;
}
