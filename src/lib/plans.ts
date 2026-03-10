import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanKey = "free" | "grow" | "premium" | "elite";

export const PLAN_INVITE_LIMITS: Record<PlanKey, number> = {
  free: 20,
  grow: 150,
  premium: 500,
  elite: 3000,
};

export function getInviteLimitForPlan(plan?: string): number {
  if (!plan) return PLAN_INVITE_LIMITS.free;
  const normalized = plan.toLowerCase() as PlanKey;
  return PLAN_INVITE_LIMITS[normalized] ?? PLAN_INVITE_LIMITS.free;
}

/**
 * Resolve active plan code for a business.
 * Source of truth: subscriptions table.
 */
export async function getActivePlanCodeForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<string> {
  // Backwards-compatible helper that returns the raw subscription plan_code.
  // Prefer getActivePlanKeyForBusiness when you need a normalized PlanKey.

  // Get owner
  const { data: business } = await db
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business?.owner_id) {
    return "business_free";
  }

  const { data: subscription } = await db
    .from("subscriptions")
    .select("plan_code, status")
    .eq("user_id", business.owner_id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (!subscription?.plan_code) {
    return "business_free";
  }

  return subscription.plan_code;
}

/**
 * Resolve the active business plan as a normalized PlanKey.
 * Source of truth: subscriptions.plan_code, with support for
 * values like "grow" or "business_grow".
 */
export async function getActivePlanKeyForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<PlanKey> {
  // Get owner (and legacy plan, if present)
  const { data: business } = await db
    .from("businesses")
    .select("owner_id, plan")
    .eq("id", businessId)
    .maybeSingle();

  const ownerId = business?.owner_id as string | undefined;

  let rawCode: string | null = null;

  if (ownerId) {
    const { data: subscription } = await db
      .from("subscriptions")
      .select("plan_code, status")
      .eq("user_id", ownerId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    rawCode = (subscription?.plan_code as string | null) ?? null;
  }

  // If we don't have a subscription plan_code, fall back to businesses.plan
  if (!rawCode && business?.plan) {
    rawCode = String(business.plan);
  }

  if (!rawCode) {
    return "free";
  }

  let normalized = String(rawCode).trim().toLowerCase();

  // Strip common prefixes/suffixes, e.g. "business_premium_monthly" -> "premium"
  if (normalized.startsWith("business_")) {
    normalized = normalized.replace(/^business_/, "");
  }
  if (normalized.includes("_")) {
    normalized = normalized.split("_")[0]!;
  }

  if (normalized === "free" || normalized === "grow" || normalized === "premium" || normalized === "elite") {
    return normalized as PlanKey;
  }

  return "free";
}
