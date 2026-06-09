import { PLAN_EXTERNAL_LINK_LIMITS } from "@/lib/plans";

/** Grow-tier default when no plan is available (legacy alias). */
export const DEFAULT_MAX_EXTERNAL_LINKS = PLAN_EXTERNAL_LINK_LIMITS.grow;

/** @deprecated Use plan-specific limits via getExternalLinkLimitForPlan */
export const MAX_EXTERNAL_LINKS = DEFAULT_MAX_EXTERNAL_LINKS;

export const MAX_SAME_EXTERNAL_URL_OCCURRENCES = 3;
