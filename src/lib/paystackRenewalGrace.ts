/** Row shape for recurring-renewal grace / eligibility checks. */
export type RecurringRenewalGraceRow = {
  status?: string | null;
  paystack_authorization_code?: string | null;
  trial_card_captured_at?: string | null;
  recurring_billing_enabled?: boolean | null;
  renewal_grace_ends_at?: string | null;
  renewal_failed_at?: string | null;
};

/** Stored-card card-on-trial with explicit recurring consent (Build 2.5 scope). */
export function isRecurringRenewalCandidateRow(
  row: RecurringRenewalGraceRow,
): boolean {
  const auth = row.paystack_authorization_code?.trim() ?? "";
  const trialCaptured = row.trial_card_captured_at?.trim() ?? "";
  return (
    row.recurring_billing_enabled === true &&
    auth.length > 0 &&
    trialCaptured.length > 0
  );
}

/**
 * Recurring renewal grace: `past_due` with a future `renewal_grace_ends_at`.
 * Trial-end failures set `past_due` without `renewal_grace_ends_at` → not grace.
 */
export function isRecurringRenewalGraceActive(
  row: RecurringRenewalGraceRow,
  now: Date = new Date(),
): boolean {
  if (String(row.status ?? "").trim().toLowerCase() !== "past_due") {
    return false;
  }
  const graceEnd = row.renewal_grace_ends_at?.trim() ?? "";
  if (!graceEnd) return false;
  const t = new Date(graceEnd).getTime();
  return Number.isFinite(t) && t > now.getTime();
}

/** Grace window ended; eligible for expire-to-free (auth retained for win-back). */
export function isRecurringRenewalGraceExpired(
  row: RecurringRenewalGraceRow,
  now: Date = new Date(),
): boolean {
  if (String(row.status ?? "").trim().toLowerCase() !== "past_due") {
    return false;
  }
  const graceEnd = row.renewal_grace_ends_at?.trim() ?? "";
  if (!graceEnd) return false;
  const t = new Date(graceEnd).getTime();
  return Number.isFinite(t) && t <= now.getTime();
}
