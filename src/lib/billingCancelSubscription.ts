import { hasExplicitPendingCancelToFree } from "@/lib/paystackSubscriptionCancelGuards";
import { normalizePlanCodeToKey } from "@/lib/plans";

export type SubscriptionCancelRow = {
  plan_code?: string | null;
  status?: string | null;
  current_period_end?: string | null;
  cancelled_at?: string | null;
  pending_plan_code?: string | null;
  paystack_authorization_code?: string | null;
  trial_card_captured_at?: string | null;
  recurring_billing_enabled?: boolean | null;
};

export function hasCancelledAtTimestamp(cancelledAt: string | null | undefined): boolean {
  return cancelledAt != null && String(cancelledAt).trim() !== "";
}

export function isScheduledCancellationToFree(row: SubscriptionCancelRow): boolean {
  return (
    hasCancelledAtTimestamp(row.cancelled_at) &&
    hasExplicitPendingCancelToFree(row.pending_plan_code)
  );
}

export function isSubscriptionPeriodEndInFuture(
  periodEndIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const raw = periodEndIso?.trim() ?? "";
  if (!raw) return false;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) && t > now.getTime();
}

export function hasStoredPaystackAuthorization(row: SubscriptionCancelRow): boolean {
  return (row.paystack_authorization_code?.trim() ?? "").length > 0;
}

export function hasCardOnTrialCapture(row: SubscriptionCancelRow): boolean {
  return (row.trial_card_captured_at?.trim() ?? "").length > 0;
}

/**
 * Card-on-trial / stored-card recurring subs that may cancel to Free (Build 3).
 * Excludes manual Paystack checkout (no saved authorization).
 */
export function canCancelSubscriptionRow(row: SubscriptionCancelRow): boolean {
  const status = String(row.status ?? "").trim().toLowerCase();
  if (status !== "trialing" && status !== "active") return false;

  const plan = normalizePlanCodeToKey(row.plan_code);
  if (plan === "free" && status !== "trialing") return false;

  if (hasCancelledAtTimestamp(row.cancelled_at)) return false;
  if (!hasStoredPaystackAuthorization(row)) return false;

  const periodEnd = row.current_period_end?.trim() ?? "";
  if (!periodEnd) return false;

  if (status === "trialing") return true;

  return hasCardOnTrialCapture(row);
}

export function canUncancelSubscriptionRow(
  row: SubscriptionCancelRow,
  now: Date = new Date(),
): boolean {
  if (!hasCancelledAtTimestamp(row.cancelled_at)) return false;

  const plan = normalizePlanCodeToKey(row.plan_code);
  if (plan === "free") return false;

  const status = String(row.status ?? "").trim().toLowerCase();
  if (status !== "trialing" && status !== "active") return false;

  if (!isSubscriptionPeriodEndInFuture(row.current_period_end, now)) return false;

  return hasStoredPaystackAuthorization(row);
}

export type CancelSubscriptionMarkers = {
  cancelled_at: string;
  recurring_billing_enabled: false;
  pending_plan_code: "free";
  pending_change_at: string;
};

export function buildCancelSubscriptionMarkers(periodEndIso: string): CancelSubscriptionMarkers {
  const periodEnd = periodEndIso.trim();
  return {
    cancelled_at: new Date().toISOString(),
    recurring_billing_enabled: false,
    pending_plan_code: "free",
    pending_change_at: periodEnd,
  };
}
