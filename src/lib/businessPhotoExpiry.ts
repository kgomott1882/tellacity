import type { PlanKey } from "@/lib/plans";

/**
 * Free-plan automatic photo deletion is disabled. Photos stay until the
 * business removes them or upgrades for a higher upload cap.
 *
 * Legacy constants remain for admin tooling that still references day counts.
 */
export const FREE_PLAN_PHOTO_RETENTION_ENABLED = false;

export const FREE_PLAN_PHOTO_RETENTION_DAYS = 30;
export const FREE_PLAN_PHOTO_FINAL_WARNING_DAYS = 29;

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;

function parseCreatedAtMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

export function photoExpiresAtIso(
  createdAtIso: string | null | undefined,
): string | null {
  if (!FREE_PLAN_PHOTO_RETENTION_ENABLED) return null;
  const created = parseCreatedAtMs(createdAtIso);
  if (created == null) return null;
  return new Date(
    created + FREE_PLAN_PHOTO_RETENTION_DAYS * MS_PER_DAY,
  ).toISOString();
}

export function photoAgeDays(
  createdAtIso: string | null | undefined,
  now: Date = new Date(),
): number | null {
  const created = parseCreatedAtMs(createdAtIso);
  if (created == null) return null;
  return Math.max(0, (now.getTime() - created) / MS_PER_DAY);
}

export function photoHoursUntilExpiry(
  createdAtIso: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!FREE_PLAN_PHOTO_RETENTION_ENABLED) return null;
  const expires = photoExpiresAtIso(createdAtIso);
  if (!expires) return null;
  return (new Date(expires).getTime() - now.getTime()) / MS_PER_HOUR;
}

export function isFreePlanPhotoExpiringSoon(
  _planKey: PlanKey,
  _createdAtIso: string | null | undefined,
  _now: Date = new Date(),
): boolean {
  return false;
}

export function isFreePlanPhotoEligibleForDeletion(
  _planKey: PlanKey,
  _createdAtIso: string | null | undefined,
  _now: Date = new Date(),
): boolean {
  return false;
}

export function finalWarningCutoffIso(now: Date = new Date()): string {
  return new Date(
    now.getTime() - FREE_PLAN_PHOTO_FINAL_WARNING_DAYS * MS_PER_DAY,
  ).toISOString();
}

export function expiryCutoffIso(now: Date = new Date()): string {
  return new Date(
    now.getTime() - FREE_PLAN_PHOTO_RETENTION_DAYS * MS_PER_DAY,
  ).toISOString();
}
