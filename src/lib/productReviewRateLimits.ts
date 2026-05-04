import type { SupabaseClient } from "@supabase/supabase-js";

/** Hard caps (rolling windows). */
export const PRODUCT_REVIEW_MAX_PER_HOUR = 3;
export const PRODUCT_REVIEW_MAX_PER_24H = 8;

/** Burst: 3rd+ product review within this window → moderation queue (not blocked). */
export const PRODUCT_REVIEW_BURST_MINUTES = 5;

/** Catalog sweep: 6+ product reviews for same business in 1h → moderation queue. */
export const PRODUCT_REVIEW_SWEEP_PER_HOUR = 6;
export const PRODUCT_REVIEW_SWEEP_WINDOW_MS = 60 * 60 * 1000;

export const PRODUCT_REVIEW_RATE_LIMIT_MESSAGE =
  "You're reviewing too quickly. Please try again later.";

export type ProductReviewRateEvaluation =
  | { outcome: "block"; reason: "hourly_cap" | "daily_cap" }
  | {
      outcome: "allow";
      /** Public profiles only show `published` (and legacy null); `under_review` is hidden. */
      reviewStatus: "published" | "under_review";
      flags: { burstQueue: boolean; catalogSweep: boolean };
    };

function sinceIso(msAgo: number): string {
  return new Date(Date.now() - msAgo).toISOString();
}

async function countProductReviews(
  supabase: SupabaseClient,
  args: {
    businessId?: string;
    guestEmailLower: string | null;
    userId: string | null;
    sinceIso: string;
  },
): Promise<number> {
  let q = supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .not("product_photo_id", "is", null)
    .gte("created_at", args.sinceIso);

  if (args.businessId) {
    q = q.eq("business_id", args.businessId);
  }

  if (args.userId) {
    q = q.eq("user_id", args.userId);
  } else if (args.guestEmailLower) {
    // Stored emails are normalized lower in write paths; eq keeps idx use (ilike would wildcard _).
    q = q.eq("guest_email", args.guestEmailLower);
  } else {
    return 0;
  }

  const { count, error } = await q;
  if (error) {
    console.error("[productReviewRateLimits] count", error);
    return 0;
  }
  return count ?? 0;
}

/**
 * Human-behaviour limits for **product** reviews only (`product_photo_id` set).
 * Does not apply to general business reviews.
 *
 * Order: hard block → soft queue (under_review) → published.
 */
export async function evaluateProductReviewRateLimits(
  supabase: SupabaseClient,
  args: {
    businessId: string;
    guestEmailLower: string | null;
    userId: string | null;
  },
): Promise<ProductReviewRateEvaluation> {
  const hourCount = await countProductReviews(supabase, {
    ...args,
    sinceIso: sinceIso(60 * 60 * 1000),
  });
  if (hourCount >= PRODUCT_REVIEW_MAX_PER_HOUR) {
    return { outcome: "block", reason: "hourly_cap" };
  }

  const dayCount = await countProductReviews(supabase, {
    ...args,
    sinceIso: sinceIso(24 * 60 * 60 * 1000),
  });
  if (dayCount >= PRODUCT_REVIEW_MAX_PER_24H) {
    return { outcome: "block", reason: "daily_cap" };
  }

  const burstCount = await countProductReviews(supabase, {
    ...args,
    sinceIso: sinceIso(PRODUCT_REVIEW_BURST_MINUTES * 60 * 1000),
  });
  const burstQueue = burstCount >= 2;

  const sweepCount = await countProductReviews(supabase, {
    businessId: args.businessId,
    guestEmailLower: args.guestEmailLower,
    userId: args.userId,
    sinceIso: sinceIso(PRODUCT_REVIEW_SWEEP_WINDOW_MS),
  });
  const catalogSweep = sweepCount >= PRODUCT_REVIEW_SWEEP_PER_HOUR - 1;

  const soft = burstQueue || catalogSweep;
  return {
    outcome: "allow",
    reviewStatus: soft ? "under_review" : "published",
    flags: { burstQueue, catalogSweep },
  };
}
