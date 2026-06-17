import type { SupabaseClient } from "@supabase/supabase-js";
import { getActivePlanCodeForBusiness, type PlanKey } from "@/lib/plans";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

const PLAN_OPTIONS: PlanKey[] = ["free", "grow", "premium", "elite"];

/**
 * Admin manual plan change: upsert an active `subscriptions` row (create if missing)
 * and sync legacy `businesses.plan`.
 */
export async function adminUpdateBusinessPlan(
  admin: SupabaseClient,
  businessId: string,
  plan: PlanKey,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!PLAN_OPTIONS.includes(plan)) {
    return { ok: false, error: "Invalid plan selection." };
  }

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .maybeSingle();

  if (businessError) {
    return { ok: false, error: businessError.message };
  }
  if (!business) {
    return { ok: false, error: "Business not found." };
  }

  const oldPlan = await getActivePlanCodeForBusiness(businessId, admin);

  const subResult = await upsertActiveSubscriptionForBusiness(admin, {
    businessId,
    planCode: plan,
    provider: "admin",
    providerSubId: `admin:${businessId}`,
    currentPeriodEndIso: null,
  });

  if (!subResult.ok) {
    return subResult;
  }

  await syncBusinessPlanColumn(admin, businessId, plan);

  const { error: auditError } = await admin.from("subscription_changes").insert({
    business_id: businessId,
    old_plan: oldPlan,
    new_plan: plan,
  });

  if (auditError) {
    console.warn("[adminUpdateBusinessPlan] subscription_changes:", auditError.message);
  }

  return { ok: true };
}
