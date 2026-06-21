import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { getPhotoLimitForPlan, type PlanKey } from "@/lib/plans";

/**
 * Limit public-facing photo lists to the business's current plan cap.
 * Expects `photos` already ordered with {@link applyBusinessPhotosOrdering}.
 */
export function capBusinessPhotosForPublicDisplay(
  photos: readonly BusinessPhotoPublic[],
  plan: PlanKey,
): BusinessPhotoPublic[] {
  const cap = getPhotoLimitForPlan(plan);
  if (photos.length <= cap) return [...photos];
  return photos.slice(0, cap);
}

export function countPhotosHiddenOnPublicProfile(
  publishedLiveCount: number,
  plan: PlanKey,
): number {
  return Math.max(0, publishedLiveCount - getPhotoLimitForPlan(plan));
}
