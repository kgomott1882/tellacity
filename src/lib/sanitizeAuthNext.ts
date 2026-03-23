/**
 * Returns a safe same-origin path for post-auth redirects.
 * Rejects protocol-relative URLs, schemes, backslashes, and path traversal.
 */
export function sanitizeAuthNext(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  const fb =
    fallback.startsWith("/") && !fallback.startsWith("//") ? fallback : "/dashboard";
  if (raw == null || raw === "") return fb;
  const t = raw.trim();
  if (!t.startsWith("/")) return fb;
  if (t.startsWith("//")) return fb;
  if (t.includes("://") || t.includes("\\")) return fb;
  const pathPart = t.split("?")[0] ?? "";
  if (pathPart.includes("..")) return fb;
  return t;
}
