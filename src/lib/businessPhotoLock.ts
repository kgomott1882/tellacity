import type { PlanKey } from "@/lib/plans";

/** @deprecated Publish lock removed, kept for API shape compatibility. */
export const FREE_PLAN_PUBLISH_LOCK_DAYS = 30;

/** @deprecated Publish lock removed. */
export const FREE_PLAN_PUBLISH_LOCK_MESSAGE =
  "Photos are locked for 30 days after publishing on the Free plan. Upgrade to edit them now." as const;

export type PublishLockStatus = {
  locked: boolean;
  planKey: PlanKey;
  lastPublishedAt: string | null;
  lockedUntil: string | null;
  daysRemaining: number;
  hasPublished: boolean;
};

/**
 * Free-plan publish lock is disabled. Photos can be edited, deleted, and
 * re-uploaded at any time; only the per-plan photo count cap applies.
 */
export function computePublishLockStatus(
  planKey: PlanKey,
  lastPublishedAt: string | null | undefined,
): PublishLockStatus {
  const iso = lastPublishedAt ? String(lastPublishedAt) : null;
  return {
    locked: false,
    planKey,
    lastPublishedAt: iso,
    lockedUntil: null,
    daysRemaining: 0,
    hasPublished: Boolean(iso),
  };
}

/** Always false, publish lock removed. */
export function isPhotoEditLocked(
  _planKey: PlanKey,
  _status: string | null | undefined,
  _lastPublishedAt: string | null | undefined,
  _now: Date = new Date(),
): boolean {
  return false;
}

export function isPublishLockResponse(
  status: number,
  body: { error?: string; lock?: unknown } | null | undefined,
): boolean {
  if (status !== 423) return false;
  return typeof body?.error === "string";
}
