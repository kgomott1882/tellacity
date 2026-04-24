import type { PlanKey } from "@/lib/plans";

/**
 * Free-plan publish lock.
 *
 * On the Free plan, publishing arms a 30-calendar-day lock on the entire
 * photo workspace for that business: no new uploads, no edits, no deletes,
 * no further publishes until the window expires OR the owner upgrades.
 *
 * Paid plans are never locked.
 *
 * The lock window is anchored on `max(published_at)` across a business's
 * published photos (exposed via the `business_photo_publish_latest` view
 * in the database). This keeps the lock in sync with whatever the business
 * last pushed live, and is cumulative — publishing a new photo extends the
 * window to 30 days from that publish.
 */

export const FREE_PLAN_PUBLISH_LOCK_DAYS = 30;

export const FREE_PLAN_PUBLISH_LOCK_MESSAGE =
  "Photos are locked for 30 days after publishing on the Free plan. Upgrade to edit them now." as const;

export type PublishLockStatus = {
  /** True when the caller is on Free and inside the 30-day window. */
  locked: boolean;
  /** The plan used to compute the lock. */
  planKey: PlanKey;
  /** ISO of the most recent publish, or null when nothing has been published. */
  lastPublishedAt: string | null;
  /** ISO of when the lock expires, or null when not locked. */
  lockedUntil: string | null;
  /** Whole days remaining (ceil, >=0). 0 when unlocked. */
  daysRemaining: number;
  /** True when the business has any published photos at all. */
  hasPublished: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the Free-plan publish lock state for a business.
 */
export function computePublishLockStatus(
  planKey: PlanKey,
  lastPublishedAt: string | null | undefined,
  now: Date = new Date()
): PublishLockStatus {
  const iso = lastPublishedAt ? String(lastPublishedAt) : null;
  const hasPublished = Boolean(iso);

  const base: PublishLockStatus = {
    locked: false,
    planKey,
    lastPublishedAt: iso,
    lockedUntil: null,
    daysRemaining: 0,
    hasPublished,
  };

  if (planKey !== "free" || !iso) return base;

  const lastMs = Date.parse(iso);
  if (!Number.isFinite(lastMs)) return base;

  const unlockMs = lastMs + FREE_PLAN_PUBLISH_LOCK_DAYS * DAY_MS;
  const nowMs = now.getTime();
  if (nowMs >= unlockMs) return base;

  const remainingMs = unlockMs - nowMs;
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / DAY_MS));
  return {
    ...base,
    locked: true,
    lockedUntil: new Date(unlockMs).toISOString(),
    daysRemaining,
  };
}

/**
 * True when editing / deleting *this* photo should be blocked on the
 * caller's plan. Uses the business-wide 30-day lock (a photo is locked
 * if the business is currently inside its lock window AND the photo
 * itself is published — drafts remain editable under the business lock).
 */
export function isPhotoEditLocked(
  planKey: PlanKey,
  status: string | null | undefined,
  lastPublishedAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (planKey !== "free") return false;
  if (status !== "published") return false;
  return computePublishLockStatus(planKey, lastPublishedAt, now).locked;
}

export function isPublishLockResponse(
  status: number,
  body: { error?: string; lock?: unknown } | null | undefined
): boolean {
  if (status !== 423) return false;
  return typeof body?.error === "string";
}
