import type { PlanKey } from "@/lib/plans";

/** Monotonic rank for upgrade / downgrade comparison (Stripe-style). */
export const PLAN_RANK: Record<PlanKey, number> = {
  free: 0,
  grow: 1,
  premium: 2,
  elite: 3,
};

export function planRank(plan: PlanKey): number {
  return PLAN_RANK[plan] ?? 0;
}

export function isPlanUpgrade(selected: PlanKey, current: PlanKey): boolean {
  return planRank(selected) > planRank(current);
}

export function isPlanDowngrade(selected: PlanKey, current: PlanKey): boolean {
  return planRank(selected) < planRank(current);
}
