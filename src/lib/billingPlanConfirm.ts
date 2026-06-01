import type { PlanKey } from "@/lib/plans";

const PAID_KEYS = new Set<PlanKey>(["grow", "premium", "elite"]);

export type PaidPlanKey = "grow" | "premium" | "elite";

export function parseBillingPlanQuery(
  raw: string | string[] | undefined | null
): PlanKey | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return null;
  const p = s.trim().toLowerCase();
  if (p === "free" || p === "grow" || p === "premium" || p === "elite") {
    return p as PlanKey;
  }
  return null;
}

export function parseBillingCycleQuery(
  raw: string | string[] | undefined | null,
  options: { strict: true }
): "monthly" | "annual" | null;
export function parseBillingCycleQuery(
  raw: string | string[] | undefined | null,
  options?: { strict?: false }
): "monthly" | "annual";
export function parseBillingCycleQuery(
  raw: string | string[] | undefined | null,
  options?: { strict?: boolean }
): "monthly" | "annual" | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  const strict = options?.strict === true;
  if (strict) {
    if (typeof s !== "string") return null;
    const t = s.trim().toLowerCase();
    if (t === "") return null;
    if (t === "annual") return "annual";
    if (t === "monthly") return "monthly";
    return null;
  }
  if (typeof s !== "string") return "monthly";
  return s.trim().toLowerCase() === "annual" ? "annual" : "monthly";
}

/** Plans that may proceed to checkout / payment. */
export function isPaidPlanForConfirm(plan: PlanKey): plan is PaidPlanKey {
  return PAID_KEYS.has(plan);
}

export type PlanConfirmPresentation = {
  title: string;
  /** Primary amount line (monthly rate or annual due today). */
  priceLine: string;
  /** Extra context (e.g. effective monthly when paying annually). */
  priceSubLine?: string;
  bullets: string[];
};

/**
 * Single source for dashboard pricing and checkout copy.
 * Amounts are always US dollars; ZA Paystack charges convert in `billingPaystack` / `billingUsdZarRate`.
 */
export const PAID_PLAN_USD = {
  grow: { monthly: 39, annualPerMonth: 31 },
  premium: { monthly: 149, annualPerMonth: 119 },
  elite: { monthly: 329, annualPerMonth: 263 },
} as const satisfies Record<
  PaidPlanKey,
  { monthly: number; annualPerMonth: number }
>;

export function getAnnualTotalDueUsd(plan: PaidPlanKey): number {
  const row = PAID_PLAN_USD[plan];
  return row.annualPerMonth * 12;
}

export function getPlanConfirmPresentation(
  plan: PlanKey,
  cycle: "monthly" | "annual"
): PlanConfirmPresentation | null {
  if (!PAID_KEYS.has(plan)) return null;

  const key = plan as PaidPlanKey;
  const row = PAID_PLAN_USD[key];
  const monthlyAmount = row.monthly;
  const annualPerMo = row.annualPerMonth;
  const annualTotal = annualPerMo * 12;
  const approxSavingsPct = Math.round(
    (1 - annualTotal / (monthlyAmount * 12)) * 100
  );

  const titles: Record<"grow" | "premium" | "elite", string> = {
    grow: "Grow",
    premium: "Premium",
    elite: "Elite",
  };

  const bullets: Record<"grow" | "premium" | "elite", string[]> = {
    grow: [
      "Up to 150 review invites per month",
      "Email invitations & customisable templates",
      "Review & invite performance analytics",
      "Standard on-site widget library",
    ],
    premium: [
      "Up to 500 review invites per month",
      "Advanced analytics & sentiment",
      "Integrations access",
      "Priority support",
    ],
    elite: [
      "Up to 2,000 review invites per month",
      "White-label & enterprise integrations",
      "Strategic insights & benchmarking",
      "Dedicated account manager",
    ],
  };

  if (cycle === "annual") {
    return {
      title: `${titles[key]} Plan`,
      priceLine: `Due today: $${annualTotal.toLocaleString("en-US")}`,
      priceSubLine: `$${annualPerMo}/mo effective rate · billed once per year · ~${approxSavingsPct}% vs 12× monthly`,
      bullets: bullets[key],
    };
  }

  return {
    title: `${titles[key]} Plan`,
    priceLine: `$${monthlyAmount} / month`,
    bullets: bullets[key],
  };
}
