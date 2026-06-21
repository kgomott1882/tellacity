/**
 * Days remaining in a Grow trial (ceil). Returns null when not active or already ended.
 */
export function trialDaysRemaining(
  trialEndsAt: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (trialEndsAt == null || !String(trialEndsAt).trim()) return null;
  const endMs = new Date(trialEndsAt).getTime();
  if (!Number.isFinite(endMs)) return null;
  const diffMs = endMs - now.getTime();
  if (diffMs <= 0) return null;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}
