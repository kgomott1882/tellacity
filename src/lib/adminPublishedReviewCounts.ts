import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Live published + visible review counts per business (matches
 * `public.business_review_metrics_v`, same as category pages and public profiles).
 */
export async function loadPublishedReviewCountByBusinessIdMap(
  supabase: SupabaseClient,
  businessIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const ids = businessIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) return out;

  const { data, error } = await supabase
    .from("business_review_metrics_v")
    .select("business_id, review_count")
    .in("business_id", ids);

  if (error) {
    console.error("[admin] business_review_metrics_v:", error.message);
    return out;
  }

  for (const row of data ?? []) {
    const bid =
      typeof (row as { business_id?: unknown }).business_id === "string"
        ? (row as { business_id: string }).business_id
        : "";
    if (!bid) continue;
    const n = Number((row as { review_count?: unknown }).review_count) || 0;
    out.set(bid, n);
  }
  return out;
}
