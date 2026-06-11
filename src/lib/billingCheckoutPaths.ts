import type { PaidPlanKey } from "@/lib/billingPlanConfirm";

/** Only allow returnTo values that stay inside the dashboard. */
export function sanitizeBillingReturnTo(raw: unknown): string | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return null;
  const trimmed = s.trim();
  if (!trimmed.startsWith("/business/dashboard/")) return null;
  if (trimmed.includes("..") || trimmed.includes("//")) return null;
  return trimmed;
}

export function buildBillingCheckoutQuery(input: {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  returnTo?: string | null;
}): string {
  const qs = new URLSearchParams({
    plan: input.plan,
    cycle: input.cycle,
  });
  if (input.returnTo) {
    qs.set("returnTo", input.returnTo);
  }
  return qs.toString();
}

export function billingCheckoutPickerPath(
  plan: PaidPlanKey,
  cycle: "monthly" | "annual",
  returnTo?: string | null
): string {
  return `/business/dashboard/billing/checkout?${buildBillingCheckoutQuery({ plan, cycle, returnTo })}`;
}

export function billingCheckoutPaystackPath(
  plan: PaidPlanKey,
  cycle: "monthly" | "annual",
  returnTo?: string | null
): string {
  return `/business/dashboard/billing/checkout/paystack?${buildBillingCheckoutQuery({ plan, cycle, returnTo })}`;
}

export function billingCheckoutPaypalPath(
  plan: PaidPlanKey,
  cycle: "monthly" | "annual",
  returnTo?: string | null
): string {
  return `/business/dashboard/billing/checkout/paypal?${buildBillingCheckoutQuery({ plan, cycle, returnTo })}`;
}

/** Minimal checkout chrome (picker + Paystack/PayPal provider pages). */
export function isBillingCheckoutFlowPath(normalizedPath: string): boolean {
  if (normalizedPath === "/business/dashboard/billing/checkout") return true;
  if (normalizedPath.startsWith("/business/dashboard/billing/checkout/")) return true;
  return false;
}
