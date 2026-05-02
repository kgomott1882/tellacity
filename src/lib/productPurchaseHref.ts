/**
 * Prefer per-photo product URL; otherwise business website (matches dashboard / public Buy behavior).
 */
export function buildProductPurchaseHref(
  productUrl: string | null | undefined,
  fallbackWebsite: string | null | undefined
): string {
  const primary = (productUrl ?? "").trim();
  if (primary) {
    if (primary.startsWith("http://") || primary.startsWith("https://")) return primary;
    return `https://${primary}`;
  }
  const fb = (fallbackWebsite ?? "").trim();
  if (!fb) return "";
  if (fb.startsWith("http://") || fb.startsWith("https://")) return fb;
  return `https://${fb}`;
}
