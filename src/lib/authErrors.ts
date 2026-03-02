/**
 * Supabase auth can throw AbortError when the lock is released (e.g. component unmount,
 * navigation, or multiple tabs). It may be an Error or a DOMException; DOMException
 * is not instanceof Error, so we check by name/message.
 */
export function isAbortError(e: unknown): boolean {
  if (e == null || typeof e !== "object") return false;
  const name = (e as { name?: string }).name;
  const message = (e as { message?: string }).message;
  if (name === "AbortError") return true;
  if (typeof message === "string" && message.includes("aborted")) return true;
  return false;
}
