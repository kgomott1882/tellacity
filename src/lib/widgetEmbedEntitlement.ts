import type { WidgetType } from "@/components/widgets/types";
import { canAccessWebsiteWidget, type PlanKey } from "@/lib/plans";
import { getWebsiteWidgetById, WEBSITE_WIDGETS } from "@/lib/widgetsConfig";

/** Default free-tier embed when the requested type is not entitled. */
export const FREE_TIER_WIDGET_EMBED_TYPE: WidgetType = "collector";

/**
 * Resolve which embed `type` to render for the business's current plan.
 * Mirrors the dashboard widget gallery: same `canAccessWebsiteWidget` mapping,
 * same fallback (first entitled widget in registry order, else collector).
 */
export function resolveEntitledWidgetEmbedType(
  requestedType: WidgetType,
  plan: PlanKey,
  options?: { skipEntitlementCheck?: boolean },
): WidgetType {
  if (options?.skipEntitlementCheck) {
    return requestedType;
  }

  const def = getWebsiteWidgetById(requestedType);
  if (def && canAccessWebsiteWidget(plan, def.planWidget)) {
    return requestedType;
  }

  const fallback = WEBSITE_WIDGETS.find((w) => canAccessWebsiteWidget(plan, w.planWidget));
  return (fallback?.id ?? FREE_TIER_WIDGET_EMBED_TYPE) as WidgetType;
}
