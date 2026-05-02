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

/** Returned with HTTP 403 when a Free-plan exclusive-category rule blocks an upload. */
export const FREE_PLAN_EXCLUSIVE_UPLOAD_CODE = "FREE_PLAN_EXCLUSIVE_UPLOAD" as const;

export function normalizePhotoSectionSlug(slug: string | null | undefined): string {
  const s = String(slug ?? "gallery").toLowerCase().trim();
  return s || "gallery";
}

/** Distinct section slugs that currently have at least one photo (draft or published). */
export function getOccupiedPhotoSectionSlugs(
  photos: ReadonlyArray<{ section?: string | null }>
): Set<string> {
  const set = new Set<string>();
  for (const p of photos) {
    set.add(normalizePhotoSectionSlug(p.section));
  }
  return set;
}

export type FreePlanExclusiveUploadGate =
  | { blocked: false }
  | { blocked: true; message: string };

/**
 * Free plan: uploads must stay in a single category at a time (Gallery, Products, or Other).
 * First upload picks the category; more uploads only to that category until all photos there are removed.
 * If photos exist in multiple sections (legacy / edge case), block uploads until the owner consolidates.
 */
export function evaluateFreePlanExclusiveUpload(
  plan: PlanKey,
  targetSectionSlug: string,
  photos: ReadonlyArray<{ section?: string | null }>
): FreePlanExclusiveUploadGate {
  if (plan !== "free") return { blocked: false };

  const target = normalizePhotoSectionSlug(targetSectionSlug);
  const occupied = getOccupiedPhotoSectionSlugs(photos);

  if (occupied.size === 0) return { blocked: false };

  if (occupied.size > 1) {
    return {
      blocked: true,
      message:
        "On the Free plan you use one photo category at a time. Remove photos from extra sections until only one category remains, then continue uploading.",
    };
  }

  const onlySection = [...occupied][0]!;
  if (onlySection !== target) {
    return {
      blocked: true,
      message:
        "On the Free plan you use one photo category at a time. Select the category that already has your photos, or delete those photos to switch between Gallery, Products, or Other.",
    };
  }

  return { blocked: false };
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

export function isFreePlanExclusiveUploadResponse(
  status: number,
  body: { error?: string; code?: string } | null | undefined
): boolean {
  return status === 403 && body?.code === FREE_PLAN_EXCLUSIVE_UPLOAD_CODE;
}

/** @deprecated Replaced by exclusive-category responses; retained for stale clients. */
export const FREE_PLAN_SECTION_LOCK_MESSAGE =
  "Upgrade to upload to this section. Free plans can only upload to Gallery." as const;

/**
 * @deprecated Free plan no longer uses this exact message; prefer
 * {@link isFreePlanExclusiveUploadResponse}.
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
