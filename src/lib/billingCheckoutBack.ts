import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** Set before `router.replace` into checkout so Back can restore the replaced screen. */
export const BILLING_CHECKOUT_BACK_OVERRIDE_KEY = "tellacity_checkout_back_override";

export function stashBillingCheckoutBackPath(path: string): void {
  if (typeof window === "undefined") return;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/business/dashboard/")) return;
  if (trimmed.includes("..") || trimmed.includes("//")) return;
  try {
    window.sessionStorage.setItem(BILLING_CHECKOUT_BACK_OVERRIDE_KEY, trimmed);
  } catch {
    /* ignore */
  }
}

export function peekBillingCheckoutBackOverride(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(BILLING_CHECKOUT_BACK_OVERRIDE_KEY)?.trim();
    if (!v?.startsWith("/business/dashboard/")) return null;
    if (v.includes("..") || v.includes("//")) return null;
    return v;
  } catch {
    return null;
  }
}

export function clearBillingCheckoutBackOverride(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BILLING_CHECKOUT_BACK_OVERRIDE_KEY);
  } catch {
    /* ignore */
  }
}

type NavigateBillingCheckoutBackOptions = {
  returnTo?: string | null;
  /** When set, Back returns to an explicit in-flow step (e.g. payment method picker). */
  backHref?: string | null;
};

/**
 * Returns the user to the screen they came from.
 * Prefers browser history (preserves in-memory dashboard state), then a stashed
 * path from replace-based redirects, then an explicit `returnTo`, then billing.
 */
export function navigateBillingCheckoutBack(
  router: AppRouterInstance,
  { returnTo, backHref }: NavigateBillingCheckoutBackOptions
): void {
  if (backHref) {
    router.push(backHref);
    return;
  }

  if (typeof window === "undefined") {
    router.push(returnTo ?? "/business/dashboard/billing");
    return;
  }

  const override = peekBillingCheckoutBackOverride();
  if (override) {
    clearBillingCheckoutBackOverride();
    router.push(override);
    return;
  }

  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  router.push(returnTo ?? "/business/dashboard/billing");
}
