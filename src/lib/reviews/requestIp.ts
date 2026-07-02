/**
 * Resolve the client IP from an incoming App Router request.
 * Prefers proxy headers (Vercel / load balancers), then optional `request.ip`.
 */
export function getClientIpFromRequest(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const xRealIp = req.headers.get("x-real-ip")?.trim();
  if (xRealIp) return xRealIp;

  const reqWithIp = req as Request & { ip?: string | null };
  if (typeof reqWithIp.ip === "string" && reqWithIp.ip.trim()) {
    return reqWithIp.ip.trim();
  }

  return null;
}
