import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateReviewRisk } from "@/lib/reviews/riskScoring";

/**
 * Score a newly inserted review and persist risk fields.
 * Failures are logged but do not throw (review submission should still succeed).
 */
export async function applyReviewRiskAfterInsert(
  supabase: SupabaseClient,
  reviewId: string,
): Promise<void> {
  try {
    const result = await calculateReviewRisk(supabase, reviewId);
    const { error } = await supabase
      .from("reviews")
      .update({
        risk_score: result.score,
        risk_status: result.status,
        is_flagged: result.score >= 50,
        moderation_reason:
          result.reasons.length > 0 ? JSON.stringify(result.reasons) : null,
      })
      .eq("id", reviewId);

    if (error) {
      console.error("[review risk] persist failed", reviewId, error.message);
    }
  } catch (err) {
    console.error("[review risk] scoring failed", reviewId, err);
  }
}
