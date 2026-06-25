import { normalizePlanCodeToKey } from "@/lib/plans";

export type SubscriptionCancelGuardRow = {
  cancelled_at?: string | null;
  recurring_billing_enabled?: boolean | null;
  pending_plan_code?: string | null;
};

function hasCancelledAt(cancelledAt: string | null | undefined): boolean {
  return cancelledAt != null && String(cancelledAt).trim() !== "";
}

/** True only when `pending_plan_code` is explicitly set to free (not null/empty). */
export function hasExplicitPendingCancelToFree(
  pendingPlanCode: string | null | undefined,
): boolean {
  const raw = pendingPlanCode != null ? String(pendingPlanCode).trim() : "";
  if (!raw) return false;
  return normalizePlanCodeToKey(raw) === "free";
}

function hasPendingCancelToFree(pendingPlanCode: string | null | undefined): boolean {
  return hasExplicitPendingCancelToFree(pendingPlanCode);
}

/** Trial-end charge must never run when any cancel marker is set (Build 3). */
export function isTrialEndChargeCancelled(row: SubscriptionCancelGuardRow): boolean {
  if (hasCancelledAt(row.cancelled_at)) return true;
  if (row.recurring_billing_enabled === false) return true;
  if (hasPendingCancelToFree(row.pending_plan_code)) return true;
  return false;
}

/** Renewal charge must never run when cancellation is scheduled or recorded (Build 3). */
export function isRenewalChargeCancelled(row: SubscriptionCancelGuardRow): boolean {
  if (hasCancelledAt(row.cancelled_at)) return true;
  if (hasPendingCancelToFree(row.pending_plan_code)) return true;
  return false;
}
