import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Count + average for reviews shown on the public profile and Manage reviews:
 * `status = published` and public-on-business visibility.
 * Direct query on `reviews` (avoids empty rows from `business_review_metrics_v` when the view is missing or out of sync).
 */
export async function getPublishedVisibleReviewAggregates(
  db: SupabaseClient,
  businessId: string,
): Promise<{ reviewCount: number; averageRating: number }> {
  const { data, error } = await db
    .from("reviews")
    .select("rating")
    .eq("business_id", businessId)
    .eq("status", "published")
    .in("visibility", ["visible", "landing_hidden"]);

  if (error) {
    console.warn("[review aggregates]", error.message);
    return { reviewCount: 0, averageRating: 0 };
  }

  const ratings = (data ?? [])
    .map((row: { rating?: number | null }) => Number(row.rating))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

  if (ratings.length === 0) {
    return { reviewCount: 0, averageRating: 0 };
  }

  const sum = ratings.reduce((a, b) => a + b, 0);
  return {
    reviewCount: ratings.length,
    averageRating: sum / ratings.length,
  };
}
