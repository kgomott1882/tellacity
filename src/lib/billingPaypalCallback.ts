import { resolveAppOriginForPaystackCallback } from "@/lib/billingPaystackCallback";

function isSafeDashboardReturnPath(path: string): boolean {
  const p = path.trim();
  return p.startsWith("/business/dashboard/") && !p.includes("..") && !p.includes("//");
}

export function buildPaypalBillingReturnUrl(
  req: Request,
  businessId: string,
  options?: { returnPath?: string | null }
): string {
  const origin = resolveAppOriginForPaystackCallback(req);
  const u = new URL("/business/dashboard/billing/paypal-return", origin);
  u.searchParams.set("business_id", businessId);
  const ret = typeof options?.returnPath === "string" ? options.returnPath.trim() : "";
  if (ret && isSafeDashboardReturnPath(ret)) {
    u.searchParams.set("return_to", ret);
  }
  return u.toString();
}

export function buildPaypalBillingCancelUrl(
  req: Request,
  plan: string,
  cycle: string,
  returnPath?: string | null
): string {
  const origin = resolveAppOriginForPaystackCallback(req);
  const u = new URL("/business/dashboard/billing/checkout/paypal", origin);
  u.searchParams.set("plan", plan);
  u.searchParams.set("cycle", cycle);
  const ret = typeof returnPath === "string" ? returnPath.trim() : "";
  if (ret && isSafeDashboardReturnPath(ret)) {
    u.searchParams.set("returnTo", ret);
  }
  return u.toString();
}
