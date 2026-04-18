/**
 * Billing period end for a successful Paystack charge (monthly vs annual).
 * Used by verify + webhook so `current_period_end` is always written on success.
 */
export function computePaystackCurrentPeriodEndIso(
  cycle: "monthly" | "annual",
  from: Date = new Date()
): string {
  const periodEnd = new Date(from.getTime());
  if (cycle === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }
  return periodEnd.toISOString();
}
