import type { RecurringRenewalGraceRow } from "@/lib/paystackRenewalGrace";
import { isRecurringRenewalGraceActive } from "@/lib/paystackRenewalGrace";

/** Subscriptions that grant the current billed / feature plan (used app-wide). */
export const SUBSCRIPTION_STATUSES_FOR_PLAN = ["active", "trialing"] as const;

export type PlanResolutionSubscriptionRow = {
  plan_code?: string | null;
  status?: string | null;
  updated_at?: string | null;
  current_period_end?: string | null;
  pending_plan_code?: string | null;
  pending_change_at?: string | null;
  renewal_grace_ends_at?: string | null;
};

export type PickPlanResolutionOptions = {
  now?: Date;
};

/**
 * When multiple subscription rows exist (e.g. active + trialing), prefer `active`,
 * then `trialing`, then recurring-grace `past_due`, newest `updated_at` first within each status.
 */
export function pickPlanResolutionSubscriptionRow<
  T extends PlanResolutionSubscriptionRow & RecurringRenewalGraceRow,
>(rows: T[] | null | undefined, options?: PickPlanResolutionOptions): T | null {
  if (!rows?.length) return null;
  const now = options?.now ?? new Date();
  const statusRank = (s: string | null | undefined, row: T) => {
    const v = String(s ?? "").toLowerCase();
    if (v === "active") return 0;
    if (v === "past_due" && isRecurringRenewalGraceActive(row, now)) return 0;
    if (v === "trialing") return 1;
    return 2;
  };
  const time = (iso: string | null | undefined) => {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : 0;
  };
  const hasPeriodEnd = (r: T) => {
    const v = r.current_period_end;
    return v != null && String(v).trim() !== "";
  };
  const sorted = [...rows].sort((a, b) => {
    const dr = statusRank(a.status, a) - statusRank(b.status, b);
    if (dr !== 0) return dr;
    const pr = Number(hasPeriodEnd(b)) - Number(hasPeriodEnd(a));
    if (pr !== 0) return pr;
    return time(b.updated_at) - time(a.updated_at);
  });
  const best = sorted[0];
  const st = String(best?.status ?? "").toLowerCase();
  if (st === "active" || st === "trialing") return best;
  if (st === "past_due" && isRecurringRenewalGraceActive(best, now)) return best;
  return null;
}
