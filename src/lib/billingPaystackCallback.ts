/**
 * Paystack `callback_url` after redirect checkout (full-page Paystack UI).
 * Paystack appends `reference` to this URL when the customer returns.
 */

export function resolveAppOriginForPaystackCallback(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (!host) return "http://localhost:3000";

  const proto = (req.headers.get("x-forwarded-proto") ?? "http").split(",")[0]?.trim() || "http";
  return `${proto}://${host}`.replace(/\/$/, "");
}

function isSafeDashboardReturnPath(path: string): boolean {
  const p = path.trim();
  return p.startsWith("/business/dashboard/") && !p.includes("..") && !p.includes("//");
}

/** Return URL for billing Paystack redirect; Paystack adds `&reference=…` (or `?reference` if no query). */
export function buildPaystackBillingReturnCallbackUrl(
  req: Request,
  businessId: string,
  options?: { returnPath?: string | null }
): string {
  const origin = resolveAppOriginForPaystackCallback(req);
  const u = new URL("/business/dashboard/billing/paystack-return", origin);
  u.searchParams.set("business_id", businessId);
  const ret = typeof options?.returnPath === "string" ? options.returnPath.trim() : "";
  if (ret && isSafeDashboardReturnPath(ret)) {
    u.searchParams.set("return_to", ret);
  }
  return u.toString();
}
