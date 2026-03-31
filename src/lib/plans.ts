import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanKey = "free" | "grow" | "premium" | "elite";

export const PLAN_INVITE_LIMITS: Record<PlanKey, number> = {
  free: 20,
  grow: 150,
  premium: 500,
  elite: 3000,
};

/** Normalize subscription `plan_code` (e.g. business_grow_monthly) to a PlanKey. */
export function normalizePlanCodeToKey(raw: string | null | undefined): PlanKey {
  if (!raw || !String(raw).trim()) return "free";
  let normalized = String(raw).trim().toLowerCase();
  if (normalized.startsWith("business_")) {
    normalized = normalized.replace(/^business_/, "");
  }
  if (normalized.includes("_")) {
    normalized = normalized.split("_")[0]!;
  }
  if (
    normalized === "free" ||
    normalized === "grow" ||
    normalized === "premium" ||
    normalized === "elite"
  ) {
    return normalized as PlanKey;
  }
  return "free";
}

export function getInviteLimitForPlan(plan?: string): number {
  if (!plan) return PLAN_INVITE_LIMITS.free;
  const normalized = normalizePlanCodeToKey(plan);
  return PLAN_INVITE_LIMITS[normalized] ?? PLAN_INVITE_LIMITS.free;
}

async function fetchActiveSubscriptionPlanCode(
  businessId: string,
  db: SupabaseClient
): Promise<string | null> {
  const { data: rows, error } = await db
    .from("subscriptions")
    .select("plan_code")
    .eq("business_id", businessId)
    .eq("status", "active")
    .limit(1);

  if (error) {
    console.error("[plans] subscriptions lookup:", error.message);
    return null;
  }

  return (rows?.[0]?.plan_code as string | null) ?? null;
}

/**
 * Raw plan_code from the active subscription row, or null if none.
 */
export async function getActivePlanCodeForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<string | null> {
  return fetchActiveSubscriptionPlanCode(businessId, db);
}

/**
 * Active plan for a business: `subscriptions` where business_id matches and status is `active`.
 * No `businesses.plan` — if no row, returns `free`.
 */
export async function getActivePlanKeyForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<PlanKey> {
  const rawCode = await fetchActiveSubscriptionPlanCode(businessId, db);
  return normalizePlanCodeToKey(rawCode);
}

/** Matches admin `parseRpcNumber` for `get_bonus_invites` return shapes. */
function parseBonusInvitesRpc(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Math.max(0, Math.trunc(Number(value)));
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown> | number | string | null;
    if (typeof first === "number" || typeof first === "string") {
      return parseBonusInvitesRpc(first);
    }
    if (first && typeof first === "object") {
      if ("bonus_invites" in first) {
        return parseBonusInvitesRpc(
          (first as Record<string, unknown>).bonus_invites,
        );
      }
      if ("get_bonus_invites" in first) {
        return parseBonusInvitesRpc(
          (first as Record<string, unknown>).get_bonus_invites,
        );
      }
    }
  }
  return 0;
}

/**
 * Admin-granted bonus invites (RPC `get_bonus_invites`), same source as admin business controls.
 */
export async function getBonusInvitesForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<number> {
  const { data, error } = await db.rpc("get_bonus_invites", {
    p_business_id: businessId,
  });
  if (error) {
    console.warn("[plans] get_bonus_invites:", error.message);
    return 0;
  }
  return parseBonusInvitesRpc(data);
}

/**
 * Monthly invite cap: plan base limit + admin bonus (matches admin “Total Available”).
 */
export async function getMonthlyInviteLimitForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<number> {
  const plan = await getActivePlanKeyForBusiness(businessId, db);
  const base = PLAN_INVITE_LIMITS[plan];
  const bonus = await getBonusInvitesForBusiness(businessId, db);
  return Math.max(0, base + bonus);
}
