import type { SupabaseClient } from "@supabase/supabase-js";
import { isPaystackCardOnTrialEnabled, isPaystackRecurringRenewalEnabled } from "@/lib/paystackCardOnTrial";
import {
  isRecurringRenewalCandidateRow,
  isRecurringRenewalGraceActive,
  isRecurringRenewalGraceExpired,
} from "@/lib/paystackRenewalGrace";
import {
  assessPaystackSubscriptionRenewalEligibility,
  attemptPaystackSubscriptionRenewal,
  type RecurringRenewalSubscriptionRow,
} from "@/lib/paystackSubscriptionRenewal";
import {
  attemptPaystackTrialEndCharge,
  isPaystackCardOnTrialSubscriptionRow,
  type CardOnTrialSubscriptionRow,
} from "@/lib/paystackTrialEndCharge";
import { isSubscriptionInstantPassed } from "@/lib/subscriptionInstant";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import {
  pickPlanResolutionSubscriptionRow,
  SUBSCRIPTION_STATUSES_FOR_PLAN,
  type PlanResolutionSubscriptionRow,
} from "@/lib/subscriptionPlanPick";
import { syncBusinessPlanColumn } from "@/lib/subscriptionWrite";

export { isSubscriptionInstantPassed } from "@/lib/subscriptionInstant";

export type PastDueSubscriptionAction =
  | { type: "none" }
  | { type: "apply_pending"; newPlan: PlanKey; previousPlan: PlanKey }
  | { type: "expire_to_free"; previousPlan: PlanKey }
  | { type: "trial_end_charged"; previousPlan: PlanKey }
  | { type: "trial_end_charge_failed"; previousPlan: PlanKey }
  | { type: "renewal_charged"; previousPlan: PlanKey }
  | { type: "renewal_grace_started"; previousPlan: PlanKey }
  | { type: "renewal_retried"; previousPlan: PlanKey }
  | { type: "renewal_expired_after_grace"; previousPlan: PlanKey };

type ReconcileSubscriptionRow = PlanResolutionSubscriptionRow &
  CardOnTrialSubscriptionRow &
  RecurringRenewalSubscriptionRow;

const RENEWAL_SUBSCRIPTION_SELECT =
  "business_id, plan_code, status, updated_at, current_period_end, pending_plan_code, pending_change_at, cancelled_at, paystack_authorization_code, paystack_customer_email, trial_end_charge_reference, trial_end_charge_failed_at, provider, provider_sub_id, reverse_trial_used_at, trial_card_captured_at, recurring_billing_enabled, renewal_charge_reference, renewal_charge_for_period_end, renewal_failed_at, renewal_failure_message, renewal_retry_count, renewal_next_retry_at, renewal_grace_ends_at";

/**
 * Decide what to do when `current_period_end` has passed.
 * Renewal is a new Paystack charge that sets a new period end; otherwise access lapses.
 */
export function computePastDueSubscriptionAction(
  row: PlanResolutionSubscriptionRow,
  now: Date = new Date(),
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
  auditNote: string,
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
      auditError.message,
    );
  }

  return { ok: true };
}

async function clearRenewalCycleFields(
  db: SupabaseClient,
  businessId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db
    .from("subscriptions")
    .update({
      renewal_charge_reference: null,
      renewal_charge_for_period_end: null,
      renewal_failed_at: null,
      renewal_failure_message: null,
      renewal_retry_count: 0,
      renewal_next_retry_at: null,
      renewal_grace_ends_at: null,
      updated_at: now,
    })
    .eq("business_id", businessId);

  if (error) {
    console.warn("[subscriptionExpiry] clear renewal cycle fields:", error.message);
  }
}

async function expireSubscriptionAfterRenewalGrace(
  db: SupabaseClient,
  businessId: string,
  previousPlan: PlanKey,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const written = await writeSubscriptionPlanTransition(
    db,
    businessId,
    "free",
    previousPlan,
    "renewal_grace_expired",
  );
  if (!written.ok) {
    return written;
  }
  await clearRenewalCycleFields(db, businessId);
  return { ok: true };
}

function resolveReconcileRow(
  typedRows: ReconcileSubscriptionRow[],
  picked: ReconcileSubscriptionRow,
): ReconcileSubscriptionRow {
  return (
    typedRows.find((r) => r === picked) ??
    typedRows.find(
      (r) =>
        String(r.status ?? "").toLowerCase() ===
        String(picked.status ?? "").toLowerCase(),
    ) ??
    picked
  );
}

function paidPlanRawCode(row: ReconcileSubscriptionRow): string | null {
  return row.plan_code != null && String(row.plan_code).trim()
    ? String(row.plan_code)
    : null;
}

/**
 * If the active subscription period has ended, apply a scheduled downgrade or revert to free.
 * Returns the plan code that should be used for feature resolution after reconciliation.
 */
export async function reconcileSubscriptionPeriodEnd(
  db: SupabaseClient,
  businessId: string,
  options?: { now?: Date },
): Promise<
  | { ok: true; rawPlanCode: string | null; action: PastDueSubscriptionAction }
  | { ok: false; error: string }
> {
  const now = options?.now ?? new Date();

  const { data: rows, error } = await db
    .from("subscriptions")
    .select(RENEWAL_SUBSCRIPTION_SELECT)
    .eq("business_id", businessId)
    .in("status", [...SUBSCRIPTION_STATUSES_FOR_PLAN, "past_due"]);

  if (error) {
    return { ok: false, error: error.message };
  }

  const typedRows = (rows ?? []) as ReconcileSubscriptionRow[];
  const picked = pickPlanResolutionSubscriptionRow(typedRows, { now });
  if (!picked) {
    const pastDueRow = typedRows.find(
      (r) => String(r.status ?? "").toLowerCase() === "past_due",
    );
    if (pastDueRow) {
      const fullPastDue = resolveReconcileRow(typedRows, pastDueRow);
      const previousPlanPastDue = normalizePlanCodeToKey(pastDueRow.plan_code);
      if (
        isPaystackRecurringRenewalEnabled() &&
        isRecurringRenewalCandidateRow(fullPastDue) &&
        isRecurringRenewalGraceExpired(fullPastDue, now) &&
        isSubscriptionInstantPassed(fullPastDue.current_period_end, now)
      ) {
        const expired = await expireSubscriptionAfterRenewalGrace(
          db,
          businessId,
          previousPlanPastDue,
        );
        if (!expired.ok) {
          return { ok: false, error: expired.error };
        }
        console.info("[subscriptionExpiry] renewal grace expired", {
          businessId,
          previousPlan: previousPlanPastDue,
        });
        return {
          ok: true,
          rawPlanCode: "free",
          action: {
            type: "renewal_expired_after_grace",
            previousPlan: previousPlanPastDue,
          },
        };
      }
      return { ok: true, rawPlanCode: "free", action: { type: "none" } };
    }
    return { ok: true, rawPlanCode: null, action: { type: "none" } };
  }

  const fullRow = resolveReconcileRow(typedRows, picked);
  const previousPlan = normalizePlanCodeToKey(picked.plan_code);

  if (
    isPaystackRecurringRenewalEnabled() &&
    isRecurringRenewalCandidateRow(fullRow) &&
    isRecurringRenewalGraceExpired(fullRow, now) &&
    isSubscriptionInstantPassed(fullRow.current_period_end, now)
  ) {
    const expired = await expireSubscriptionAfterRenewalGrace(
      db,
      businessId,
      previousPlan,
    );
    if (!expired.ok) {
      return { ok: false, error: expired.error };
    }
    console.info("[subscriptionExpiry] renewal grace expired", {
      businessId,
      previousPlan,
    });
    return {
      ok: true,
      rawPlanCode: "free",
      action: { type: "renewal_expired_after_grace", previousPlan },
    };
  }

  if (!isSubscriptionInstantPassed(picked.current_period_end, now)) {
    return { ok: true, rawPlanCode: paidPlanRawCode(picked), action: { type: "none" } };
  }

  const pendingPlan = picked.pending_plan_code
    ? normalizePlanCodeToKey(picked.pending_plan_code)
    : null;
  if (
    pendingPlan &&
    pendingPlan !== previousPlan &&
    isSubscriptionInstantPassed(picked.pending_change_at ?? picked.current_period_end, now)
  ) {
    const written = await writeSubscriptionPlanTransition(
      db,
      businessId,
      pendingPlan,
      previousPlan,
      "scheduled_downgrade",
    );
    if (!written.ok) {
      return { ok: false, error: written.error };
    }
    return {
      ok: true,
      rawPlanCode: pendingPlan,
      action: { type: "apply_pending", newPlan: pendingPlan, previousPlan },
    };
  }

  if (
    isPaystackCardOnTrialEnabled() &&
    isPaystackCardOnTrialSubscriptionRow(fullRow)
  ) {
    const charge = await attemptPaystackTrialEndCharge(
      db,
      businessId,
      fullRow as CardOnTrialSubscriptionRow,
    );

    if (charge.outcome === "converted") {
      return {
        ok: true,
        rawPlanCode: "grow",
        action: { type: "trial_end_charged", previousPlan },
      };
    }
    if (charge.outcome === "failed") {
      return {
        ok: true,
        rawPlanCode: "free",
        action: { type: "trial_end_charge_failed", previousPlan },
      };
    }
    if (charge.outcome === "error") {
      return { ok: false, error: charge.error };
    }
    if (charge.outcome === "skipped" && charge.reason === "charge_already_failed") {
      return {
        ok: true,
        rawPlanCode: "free",
        action: { type: "trial_end_charge_failed", previousPlan },
      };
    }
  }

  if (isPaystackRecurringRenewalEnabled() && isRecurringRenewalCandidateRow(fullRow)) {
    const hadRenewalFailure = Boolean(fullRow.renewal_failed_at);
    const eligibility = assessPaystackSubscriptionRenewalEligibility(
      { ...fullRow, business_id: businessId },
      now,
    );

    if (eligibility.eligible) {
      const renewal = await attemptPaystackSubscriptionRenewal(
        db,
        { ...fullRow, business_id: businessId },
        { now },
      );

      if (renewal.outcome === "renewed") {
        return {
          ok: true,
          rawPlanCode: eligibility.plan,
          action: { type: "renewal_charged", previousPlan },
        };
      }
      if (renewal.outcome === "grace_started") {
        return {
          ok: true,
          rawPlanCode: paidPlanRawCode(fullRow) ?? eligibility.plan,
          action: {
            type: hadRenewalFailure ? "renewal_retried" : "renewal_grace_started",
            previousPlan,
          },
        };
      }
      if (renewal.outcome === "error") {
        console.warn("[subscriptionExpiry] renewal error", {
          businessId,
          error: renewal.error,
        });
        if (isRecurringRenewalGraceActive(fullRow, now)) {
          return {
            ok: true,
            rawPlanCode: paidPlanRawCode(fullRow) ?? eligibility.plan,
            action: { type: "none" },
          };
        }
        return { ok: false, error: renewal.error };
      }
      if (renewal.outcome === "claim_lost" || renewal.outcome === "skipped") {
        if (isRecurringRenewalGraceActive(fullRow, now)) {
          return {
            ok: true,
            rawPlanCode: paidPlanRawCode(fullRow) ?? eligibility.plan,
            action: { type: "none" },
          };
        }
      }
    } else if (isRecurringRenewalGraceActive(fullRow, now)) {
      return {
        ok: true,
        rawPlanCode: paidPlanRawCode(fullRow) ?? previousPlan,
        action: { type: "none" },
      };
    }
  }

  const action = computePastDueSubscriptionAction(picked, now);
  if (action.type === "none") {
    return { ok: true, rawPlanCode: paidPlanRawCode(picked), action };
  }

  const newPlan = action.type === "apply_pending" ? action.newPlan : "free";
  const note =
    action.type === "apply_pending" ? "scheduled_downgrade" : "period_expired";

  const written = await writeSubscriptionPlanTransition(
    db,
    businessId,
    newPlan,
    previousPlan,
    note,
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
  trialEndCharged: number;
  trialEndChargeFailed: number;
  renewalsCharged: number;
  renewalGraceStarted: number;
  renewalRetried: number;
  renewalExpiredAfterGrace: number;
  errors: string[];
};

async function collectRecurringRenewalBusinessIds(
  db: SupabaseClient,
  nowIso: string,
): Promise<string[]> {
  if (!isPaystackRecurringRenewalEnabled()) {
    return [];
  }

  const ids = new Set<string>();

  const { data: retryRows, error: retryErr } = await db
    .from("subscriptions")
    .select("business_id")
    .eq("status", "past_due")
    .eq("recurring_billing_enabled", true)
    .not("paystack_authorization_code", "is", null)
    .not("trial_card_captured_at", "is", null)
    .not("renewal_grace_ends_at", "is", null)
    .gt("renewal_grace_ends_at", nowIso)
    .not("renewal_next_retry_at", "is", null)
    .lte("renewal_next_retry_at", nowIso);

  if (retryErr) {
    console.warn("[subscriptionExpiry] recurring retry scan:", retryErr.message);
  } else {
    for (const row of retryRows ?? []) {
      const id = (row as { business_id?: string | null }).business_id;
      if (typeof id === "string" && id.trim()) ids.add(id.trim());
    }
  }

  const { data: graceExpiredRows, error: graceErr } = await db
    .from("subscriptions")
    .select("business_id")
    .eq("status", "past_due")
    .eq("recurring_billing_enabled", true)
    .not("paystack_authorization_code", "is", null)
    .not("trial_card_captured_at", "is", null)
    .not("renewal_grace_ends_at", "is", null)
    .lte("renewal_grace_ends_at", nowIso)
    .not("current_period_end", "is", null)
    .lte("current_period_end", nowIso);

  if (graceErr) {
    console.warn("[subscriptionExpiry] recurring grace-expired scan:", graceErr.message);
  } else {
    for (const row of graceExpiredRows ?? []) {
      const id = (row as { business_id?: string | null }).business_id;
      if (typeof id === "string" && id.trim()) ids.add(id.trim());
    }
  }

  return [...ids];
}

/**
 * Batch job: reconcile every business whose `current_period_end` is in the past.
 */
export async function expireAllPastDueSubscriptions(
  db: SupabaseClient,
  options?: { now?: Date },
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
      trialEndCharged: 0,
      trialEndChargeFailed: 0,
      renewalsCharged: 0,
      renewalGraceStarted: 0,
      renewalRetried: 0,
      renewalExpiredAfterGrace: 0,
      errors: [error.message],
    };
  }

  const recurringIds = await collectRecurringRenewalBusinessIds(db, nowIso);

  const businessIds = [
    ...new Set([
      ...(rows ?? [])
        .map((r) => (r as { business_id?: string | null }).business_id)
        .filter((id): id is string => typeof id === "string" && id.trim() !== ""),
      ...recurringIds,
    ]),
  ];

  const result: ExpireAllPastDueResult = {
    scanned: businessIds.length,
    reconciled: 0,
    expiredToFree: 0,
    appliedPending: 0,
    trialEndCharged: 0,
    trialEndChargeFailed: 0,
    renewalsCharged: 0,
    renewalGraceStarted: 0,
    renewalRetried: 0,
    renewalExpiredAfterGrace: 0,
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
    switch (reconciled.action.type) {
      case "expire_to_free":
        result.expiredToFree += 1;
        break;
      case "apply_pending":
        result.appliedPending += 1;
        break;
      case "trial_end_charged":
        result.trialEndCharged += 1;
        break;
      case "trial_end_charge_failed":
        result.trialEndChargeFailed += 1;
        break;
      case "renewal_charged":
        result.renewalsCharged += 1;
        break;
      case "renewal_grace_started":
        result.renewalGraceStarted += 1;
        break;
      case "renewal_retried":
        result.renewalRetried += 1;
        break;
      case "renewal_expired_after_grace":
        result.renewalExpiredAfterGrace += 1;
        result.expiredToFree += 1;
        break;
      default:
        break;
    }
  }

  return result;
}
