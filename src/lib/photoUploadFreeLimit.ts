import { PLAN_PHOTO_LIMITS, type PlanKey } from "@/lib/plans";

/**
 * Error prefix returned by the upload API when a business hits its plan's total
 * photo cap. Full shape: "You've reached your plan's photo limit (<N> photos)".
 * The `<N>` piece varies by plan, so string comparisons use `startsWith`.
 */
export const PHOTO_LIMIT_MESSAGE_PREFIX =
  "You've reached your plan's photo limit" as const;

export function photoLimitMessageForPlan(plan: PlanKey): string {
  const cap = PLAN_PHOTO_LIMITS[plan] ?? PLAN_PHOTO_LIMITS.free;
  return `${PHOTO_LIMIT_MESSAGE_PREFIX} (${cap} photos).`;
}

/**
 * Back-compat re-export for call sites that still expect the Free-specific
 * constant. New code should prefer {@link photoLimitMessageForPlan}.
 */
export const FREE_PLAN_PHOTO_LIMIT_MESSAGE = photoLimitMessageForPlan("free");

/**
 * Free-plan section gate.
 *
 * On the Free plan, only the built-in Gallery section accepts uploads. All
 * other sections (Team, Workspace, Products, Services, and any custom
 * section) remain visible on the public profile as a trigger for the
 * business owner to upgrade, but their upload affordance is disabled with
 * an "Upgrade" nudge.
 */
export const FREE_PLAN_ALLOWED_SECTION = "gallery" as const;

export const FREE_PLAN_SECTION_LOCK_MESSAGE =
  "Upgrade to upload to this section. Free plans can only upload to Gallery." as const;

/**
 * True when the given section is upload-locked for the caller's plan.
 * Free plan → only Gallery is open; every paid plan can upload anywhere.
 */
export function isSectionUploadLocked(plan: PlanKey, sectionSlug: string): boolean {
  if (plan !== "free") return false;
  return String(sectionSlug ?? "").toLowerCase().trim() !== FREE_PLAN_ALLOWED_SECTION;
}

export function isPhotoLimitResponse(
  status: number,
  body: { error?: string } | null | undefined
): boolean {
  return (
    status === 403 &&
    typeof body?.error === "string" &&
    body.error.startsWith(PHOTO_LIMIT_MESSAGE_PREFIX)
  );
}

/** @deprecated Use {@link isPhotoLimitResponse}. Retained for older call sites. */
export function isFreePlanPhotoLimitResponse(
  status: number,
  body: { error?: string } | null | undefined
): boolean {
  return isPhotoLimitResponse(status, body);
}

/**
 * True when an upload response signals "this section is not available on the
 * caller's plan" (Free + non-Gallery). The API uses HTTP 403 with the
 * {@link FREE_PLAN_SECTION_LOCK_MESSAGE} body.
 */
export function isFreePlanSectionLockResponse(
  status: number,
  body: { error?: string } | null | undefined
): boolean {
  return (
    status === 403 &&
    typeof body?.error === "string" &&
    body.error === FREE_PLAN_SECTION_LOCK_MESSAGE
  );
}
