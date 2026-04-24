import { PLAN_PHOTO_LIMITS, type PlanKey } from "@/lib/plans";
import type { UpgradeFlowContext } from "@/lib/upgradeFlow";

export const BILLING_PLAN_ORDER: PlanKey[] = ["free", "grow", "premium", "elite"];

/** Profile photo limits as enforced on the server and shown on the billing page. */
export const BILLING_PLAN_PHOTOS_LABEL: Record<PlanKey, string> = {
  free: `Up to ${PLAN_PHOTO_LIMITS.free}`,
  grow: `Up to ${PLAN_PHOTO_LIMITS.grow}`,
  premium: `Up to ${PLAN_PHOTO_LIMITS.premium}`,
  elite: `Up to ${PLAN_PHOTO_LIMITS.elite}`,
};

/**
 * Photo section upload access. Sections are no longer plan-gated — every plan
 * can publish to any section (including user-defined custom ones). The labels
 * convey the cross-section nature of the new photo cap.
 */
export const BILLING_PLAN_SECTIONS_LABEL: Record<PlanKey, string> = {
  free: "Any section",
  grow: "Any section + custom",
  premium: "Any section + custom",
  elite: "Any section + custom",
};

/**
 * Billing conversion: which paid column to emphasize when arriving from photo flows.
 * `upload_limit` → Grow (more photos); `section_locked` → Premium (full sections).
 */
export function conversionHighlightPlanForContext(
  context: UpgradeFlowContext | null
): PlanKey | null {
  if (context === "upload_limit") return "grow";
  if (context === "section_locked") return "premium";
  return null;
}

/**
 * Column to emphasize in the comparison table: next meaningful step for the current plan,
 * nudged by upgrade context (Free + limits → Grow).
 */
export function highlightedPlanForBilling(
  currentPlan: PlanKey,
  context: UpgradeFlowContext | null
): PlanKey {
  const tier = (p: PlanKey) => BILLING_PLAN_ORDER.indexOf(p);

  if (context === "upload_limit" || context === "section_locked") {
    if (currentPlan === "free") return "grow";
    if (currentPlan === "grow") return "premium";
    if (currentPlan === "premium") return "elite";
    return "elite";
  }

  if (context === "general") {
    if (currentPlan === "elite") return "elite";
    return BILLING_PLAN_ORDER[Math.min(tier(currentPlan) + 1, 3)]!;
  }

  if (currentPlan === "elite") return "elite";
  return BILLING_PLAN_ORDER[Math.min(tier(currentPlan) + 1, 3)]!;
}
