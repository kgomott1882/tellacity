import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import {
  pickPlanResolutionSubscriptionRow,
  SUBSCRIPTION_STATUSES_FOR_PLAN,
  type PlanResolutionSubscriptionRow,
} from "@/lib/subscriptionPlanPick";
import { syncBusinessPlanColumn } from "@/lib/subscriptionWrite";

export type PastDueSubscriptionAction =
  | { type: "none" }
  | { type: "apply_pending"; newPlan: PlanKey; previousPlan: PlanKey }
  | { type: "expire_to_free"; previousPlan: PlanKey };

/** True when `iso` is set and at or before `now` (subscription period has ended). */
export function isSubscriptionInstantPassed(
  iso: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (iso == null || !String(iso).trim()) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t <= now.getTime();
}

/**
 * Decide what to do when `current_period_end` has passed.
 * Renewal is a new Paystack charge that sets a new period end; otherwise access lapses.
 */
export function computePastDueSubscriptionAction(
  row: PlanResolutionSubscriptionRow,
  now: Date = new Date()
): PastDueSubscriptionAction {
  if (!isSubscriptionInstantPassed(row.current_period_end, now)) {
    return { type: "none" };
  }

  const previousPlan = normalizePlanCodeToKey(row.plan_code);
  const pendingPlan = row.pending_plan_code
    ? normalizePlanCodeToKey(row.pending_plan_code)
    : null;

  if (
    pendingPlan &&
    pendingPlan !== previousPlan &&
    isSubscriptionInstantPassed(row.pending_change_at ?? row.current_period_end, now)
  ) {
    return { type: "apply_pending", newPlan: pendingPlan, previousPlan };
  }

  if (previousPlan !== "free") {
    return { type: "expire_to_free", previousPlan };
  }

  return { type: "none" };
}

async function writeSubscriptionPlanTransition(
  db: SupabaseClient,
  businessId: string,
  newPlan: PlanKey,
  previousPlan: PlanKey,
  auditNote: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();

  const { error: updateError } = await db
    .from("subscriptions")
    .update({
      plan_code: newPlan,
      status: "active",
      current_period_end: null,
      pending_plan_code: null,
      pending_change_at: null,
      updated_at: now,
    })
    .eq("business_id", businessId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await syncBusinessPlanColumn(db, businessId, newPlan);

  const { error: auditError } = await db.from("subscription_changes").insert({
    business_id: businessId,
    old_plan: previousPlan,
    new_plan: newPlan,
  });
  if (auditError) {
    console.warn(
      `[subscriptionExpiry] subscription_changes (${auditNote}):`,
      auditError.message
    );
  }

  return { ok: true };
}

/**
 * If the active subscription period has ended, apply a scheduled downgrade or revert to free.
 * Returns the plan code that should be used for feature resolution after reconciliation.
 */
export async function reconcileSubscriptionPeriodEnd(
  db: SupabaseClient,
  businessId: string,
  options?: { now?: Date }
): Promise<
  | { ok: true; rawPlanCode: string | null; action: PastDueSubscriptionAction }
  | { ok: false; error: string }
> {
  const now = options?.now ?? new Date();

  const { data: rows, error } = await db
    .from("subscriptions")
    .select(
      "plan_code, status, updated_at, current_period_end, pending_plan_code, pending_change_at"
    )
    .eq("business_id", businessId)
    .in("status", [...SUBSCRIPTION_STATUSES_FOR_PLAN]);

  if (error) {
    return { ok: false, error: error.message };
  }

  const picked = pickPlanResolutionSubscriptionRow(
    (rows ?? []) as PlanResolutionSubscriptionRow[]
  );
  if (!picked) {
    return { ok: true, rawPlanCode: null, action: { type: "none" } };
  }

  const action = computePastDueSubscriptionAction(picked, now);
  if (action.type === "none") {
    const raw =
      picked.plan_code != null && String(picked.plan_code).trim()
        ? String(picked.plan_code)
        : null;
    return { ok: true, rawPlanCode: raw, action };
  }

  const newPlan = action.type === "apply_pending" ? action.newPlan : "free";
  const previousPlan = action.previousPlan;
  const note =
    action.type === "apply_pending" ? "scheduled_downgrade" : "period_expired";

  const written = await writeSubscriptionPlanTransition(
    db,
    businessId,
    newPlan,
    previousPlan,
    note
  );
  if (!written.ok) {
    return { ok: false, error: written.error };
  }

  console.info("[subscriptionExpiry] reconciled", {
    businessId,
    action: action.type,
    previousPlan,
    newPlan,
  });

  return { ok: true, rawPlanCode: newPlan, action };
}

export type ExpireAllPastDueResult = {
  scanned: number;
  reconciled: number;
  expiredToFree: number;
  appliedPending: number;
  errors: string[];
};

/**
 * Batch job: reconcile every business whose `current_period_end` is in the past.
 */
export async function expireAllPastDueSubscriptions(
  db: SupabaseClient,
  options?: { now?: Date }
): Promise<ExpireAllPastDueResult> {
  const now = options?.now ?? new Date();
  const nowIso = now.toISOString();

  const { data: rows, error } = await db
    .from("subscriptions")
    .select("business_id")
    .in("status", [...SUBSCRIPTION_STATUSES_FOR_PLAN])
    .not("current_period_end", "is", null)
    .lte("current_period_end", nowIso);

  if (error) {
    return {
      scanned: 0,
      reconciled: 0,
      expiredToFree: 0,
      appliedPending: 0,
      errors: [error.message],
    };
  }

  const businessIds = [
    ...new Set(
      (rows ?? [])
        .map((r) => (r as { business_id?: string | null }).business_id)
        .filter((id): id is string => typeof id === "string" && id.trim() !== "")
    ),
  ];

  const result: ExpireAllPastDueResult = {
    scanned: businessIds.length,
    reconciled: 0,
    expiredToFree: 0,
    appliedPending: 0,
    errors: [],
  };

  for (const businessId of businessIds) {
    const reconciled = await reconcileSubscriptionPeriodEnd(db, businessId, { now });
    if (!reconciled.ok) {
      result.errors.push(`${businessId}: ${reconciled.error}`);
      continue;
    }
    if (reconciled.action.type === "none") continue;
    result.reconciled += 1;
    if (reconciled.action.type === "expire_to_free") {
      result.expiredToFree += 1;
    } else if (reconciled.action.type === "apply_pending") {
      result.appliedPending += 1;
    }
  }

  return result;
}
