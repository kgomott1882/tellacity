import type { PlanKey } from "@/lib/plans";

/**
 * Free-plan photo retention policy.
 *
 * Every photo uploaded by a business whose resolved plan is `free` is kept
 * for exactly {@link FREE_PLAN_PHOTO_RETENTION_DAYS} calendar days from
 * `business_photos.created_at`. Once the photo's age reaches the retention
 * window, it becomes eligible for automatic hard-deletion.
 *
 * Upgrading the business to any paid plan immediately removes the photo from
 * the expiry queue — the plan key is re-evaluated at query / deletion time
 * so there's no row state to mutate on upgrade.
 *
 * The {@link FREE_PLAN_PHOTO_FINAL_WARNING_DAYS} threshold drives the "final
 * 24-hour warning" notification shown in both the business dashboard and
 * the admin dashboard. Once a photo crosses the warning threshold but is
 * not yet eligible for deletion, it appears in the admin photo-expiry queue
 * and the business owner gets an `always_show` dashboard nudge.
 */
export const FREE_PLAN_PHOTO_RETENTION_DAYS = 30;
export const FREE_PLAN_PHOTO_FINAL_WARNING_DAYS = 29;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

function parseCreatedAtMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * ISO timestamp at which a free-plan photo uploaded at `createdAtIso`
 * becomes eligible for automatic deletion (`created_at + 30d`).
 * Returns null when the input isn't a valid date.
 */
export function photoExpiresAtIso(
  createdAtIso: string | null | undefined,
): string | null {
  const created = parseCreatedAtMs(createdAtIso);
  if (created == null) return null;
  return new Date(
    created + FREE_PLAN_PHOTO_RETENTION_DAYS * MS_PER_DAY,
  ).toISOString();
}

/** Photo age in fractional days (non-negative). Null on invalid input. */
export function photoAgeDays(
  createdAtIso: string | null | undefined,
  now: Date = new Date(),
): number | null {
  const created = parseCreatedAtMs(createdAtIso);
  if (created == null) return null;
  return Math.max(0, (now.getTime() - created) / MS_PER_DAY);
}

/**
 * Hours remaining until the photo hits the 30-day cutoff. Negative when
 * already past. Null on invalid input. Useful for "X hours left" copy.
 */
export function photoHoursUntilExpiry(
  createdAtIso: string | null | undefined,
  now: Date = new Date(),
): number | null {
  const expires = photoExpiresAtIso(createdAtIso);
  if (!expires) return null;
  return (new Date(expires).getTime() - now.getTime()) / MS_PER_HOUR;
}

/**
 * True when a free-plan photo is in the final warning window — old enough
 * to show the "will be deleted within 24 hours" warning but not yet
 * eligible for deletion. Paid plans always return false.
 */
export function isFreePlanPhotoExpiringSoon(
  planKey: PlanKey,
  createdAtIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (planKey !== "free") return false;
  const age = photoAgeDays(createdAtIso, now);
  if (age == null) return false;
  return (
    age >= FREE_PLAN_PHOTO_FINAL_WARNING_DAYS &&
    age < FREE_PLAN_PHOTO_RETENTION_DAYS
  );
}

/**
 * True when a free-plan photo has reached the retention window and can be
 * hard-deleted. Paid plans always return false.
 */
export function isFreePlanPhotoEligibleForDeletion(
  planKey: PlanKey,
  createdAtIso: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (planKey !== "free") return false;
  const age = photoAgeDays(createdAtIso, now);
  if (age == null) return false;
  return age >= FREE_PLAN_PHOTO_RETENTION_DAYS;
}

/**
 * ISO cutoff for "photos uploaded at least 29 days ago". Use in SQL filters
 * as `created_at <= <cutoff>` to pull candidates for the warning queue.
 */
export function finalWarningCutoffIso(now: Date = new Date()): string {
  return new Date(
    now.getTime() - FREE_PLAN_PHOTO_FINAL_WARNING_DAYS * MS_PER_DAY,
  ).toISOString();
}

/**
 * ISO cutoff for "photos uploaded at least 30 days ago" (eligible for
 * deletion). Use in SQL filters as `created_at <= <cutoff>`.
 */
export function expiryCutoffIso(now: Date = new Date()): string {
  return new Date(
    now.getTime() - FREE_PLAN_PHOTO_RETENTION_DAYS * MS_PER_DAY,
  ).toISOString();
}
