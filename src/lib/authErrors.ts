/**
 * Supabase auth can throw AbortError or "Lock broken by another request with the 'steal' option"
 * when the lock is released (e.g. component unmount, refresh, navigation, or multiple tabs).
 * Treat these as transient and do not redirect to login or surface to the user.
 */
export function isAbortError(e: unknown): boolean {
  if (e == null || typeof e !== "object") return false;
  const name = (e as { name?: string }).name;
  const message = typeof (e as { message?: string }).message === "string" ? (e as { message: string }).message : "";
  if (name === "AbortError") return true;
  if (message.includes("aborted")) return true;
  if (message.includes("Lock broken") || message.includes("steal")) return true;
  return false;
}
