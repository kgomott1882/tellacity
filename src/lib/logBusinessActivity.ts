import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _service: SupabaseClient | null = null;

function serviceClient(): SupabaseClient {
  if (!_service) {
    _service = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      }
    );
  }
  return _service;
}

/**
 * Server-only: inserts into `business_activity_logs` using the service role.
 * Never throws; failures are logged only so callers stay non-blocking.
 */
export async function logBusinessActivity({
  businessId,
  userId,
  action,
  metadata = {},
}: {
  businessId: string;
  userId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const { error } = await serviceClient().from("business_activity_logs").insert({
      business_id: businessId,
      user_id: userId ?? null,
      action_type: action,
      metadata: metadata as Record<string, unknown>,
    });
    if (error) {
      console.error("Activity log failed:", error.message);
    }
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}

/** After a published row exists in `reviews` — never throws. */
export async function logReviewReceivedActivity(input: {
  businessId: string;
  userId?: string | null;
  reviewId: string;
  rating: number;
}): Promise<void> {
  try {
    await logBusinessActivity({
      businessId: input.businessId,
      userId: input.userId ?? null,
      action: "review_received",
      metadata: { review_id: input.reviewId, rating: input.rating },
    });
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}

/** Recipient opened a valid invite link (validate succeeded). */
export async function logInviteOpenedActivity(input: {
  businessId: string;
  inviteId: string;
}): Promise<void> {
  try {
    await logBusinessActivity({
      businessId: input.businessId,
      userId: null,
      action: "invite_opened",
      metadata: { invite_id: input.inviteId },
    });
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}

/** Review published from an invite flow (same moment as review_received; optional). */
export async function logInviteConvertedActivity(input: {
  businessId: string;
  userId?: string | null;
  inviteId: string;
  reviewId: string;
}): Promise<void> {
  try {
    await logBusinessActivity({
      businessId: input.businessId,
      userId: input.userId ?? null,
      action: "invite_converted",
      metadata: { invite_id: input.inviteId, review_id: input.reviewId },
    });
  } catch (err) {
    console.error("Activity log failed:", err);
  }
}
