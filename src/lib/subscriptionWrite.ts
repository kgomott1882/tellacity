import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanCodeToKey } from "@/lib/plans";

type UpsertArgs = {
  businessId: string;
  planCode: string;
  /** Stored on the row when present (e.g. paystack, dashboard). */
  provider?: string | null;
  /**
   * Paystack/Stripe subscription id when known. If omitted, a stable Tellacity
   * placeholder is used so NOT NULL `provider_sub_id` inserts succeed.
   */
  providerSubId?: string | null;
};

/**
 * Ensures the business has an active subscription row with the given plan.
 * Updates all rows for the business_id (legacy multi-row), or inserts one if none exist.
 */
export async function upsertActiveSubscriptionForBusiness(
  db: SupabaseClient,
  args: UpsertArgs
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  /** DB requires NOT NULL `provider` on this project — always send a value. */
  const provider =
    args.provider != null && String(args.provider).trim() !== ""
      ? String(args.provider).trim()
      : "tellacity";

  const providerSubId =
    args.providerSubId != null && String(args.providerSubId).trim() !== ""
      ? String(args.providerSubId).trim()
      : `tellacity:${args.businessId}`;

  const { data: updated, error: updateError } = await db
    .from("subscriptions")
    .update({
      plan_code: args.planCode,
      status: "active",
      provider,
      updated_at: now,
    })
    .eq("business_id", args.businessId)
    .select("id");

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  if (updated?.length) {
    return { ok: true };
  }

  const { error: insertError } = await db.from("subscriptions").insert({
    business_id: args.businessId,
    plan_code: args.planCode,
    status: "active",
    provider,
    provider_sub_id: providerSubId,
    updated_at: now,
  });
  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}

/** Keeps `businesses.plan` aligned with subscription plan_code (free | grow | premium | elite). */
export async function syncBusinessPlanColumn(
  db: SupabaseClient,
  businessId: string,
  planCode: string
): Promise<void> {
  const plan = normalizePlanCodeToKey(planCode);
  const { error } = await db.from("businesses").update({ plan }).eq("id", businessId);
  if (error) {
    console.warn("[subscriptionWrite] businesses.plan sync failed:", error.message);
  }
}
