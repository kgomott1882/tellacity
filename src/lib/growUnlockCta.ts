import { nextTierUpgradeCtaLabel, type PlanKey } from "@/lib/plans";

export const GROW_UNLOCK_TRIAL_LABEL = "Start 14-day trial";

export type GrowUnlockMode = "trial" | "paid";

/** Grow-unlock CTA label only (no Premium/Elite trial copy). */
export function getGrowUnlockLabel(
  plan: PlanKey,
  trialEligible: boolean,
  subscriptionStatus?: string | null,
): string {
  if (resolveGrowUnlockMode(plan, trialEligible, subscriptionStatus) === "trial") {
    return GROW_UNLOCK_TRIAL_LABEL;
  }
  return plan === "free" ? nextTierUpgradeCtaLabel("free") : nextTierUpgradeCtaLabel(plan);
}

export function resolveGrowUnlockMode(
  currentPlan: PlanKey,
  trialEligible: boolean,
  subscriptionStatus?: string | null,
  /** Trial branch applies only when unlocking Grow. */
  targetPlan: "grow" = "grow",
): GrowUnlockMode {
  if (targetPlan !== "grow") return "paid";
  if (currentPlan !== "free") return "paid";
  const status = subscriptionStatus?.trim().toLowerCase() ?? "";
  if (status === "trialing") return "paid";
  if (!trialEligible) return "paid";
  return "trial";
}
