/** True when `iso` is set and at or before `now` (subscription period has ended). */
export function isSubscriptionInstantPassed(
  iso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (iso == null || !String(iso).trim()) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t <= now.getTime();
}
