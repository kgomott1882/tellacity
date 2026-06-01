/** Subscriptions that grant the current billed / feature plan (used app-wide). */
export const SUBSCRIPTION_STATUSES_FOR_PLAN = ["active", "trialing"] as const;

export type PlanResolutionSubscriptionRow = {
  plan_code?: string | null;
  status?: string | null;
  updated_at?: string | null;
  current_period_end?: string | null;
  pending_plan_code?: string | null;
  pending_change_at?: string | null;
};

/**
 * When multiple subscription rows exist (e.g. active + trialing), prefer `active`,
 * then `trialing`, newest `updated_at` first within each status.
 */
export function pickPlanResolutionSubscriptionRow<
  T extends PlanResolutionSubscriptionRow,
>(rows: T[] | null | undefined): T | null {
  if (!rows?.length) return null;
  const statusRank = (s: string | null | undefined) => {
    const v = String(s ?? "").toLowerCase();
    if (v === "active") return 0;
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
    const dr = statusRank(a.status) - statusRank(b.status);
    if (dr !== 0) return dr;
    const pr = Number(hasPeriodEnd(b)) - Number(hasPeriodEnd(a));
    if (pr !== 0) return pr;
    return time(b.updated_at) - time(a.updated_at);
  });
  const best = sorted[0];
  const st = String(best?.status ?? "").toLowerCase();
  if (st === "active" || st === "trialing") return best;
  return null;
}
