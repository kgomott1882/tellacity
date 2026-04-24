export type UpgradeFlowContext =
  | "upload_limit"
  | "section_locked"
  | "publish_lock"
  | "general";

const STORAGE_KEY = "tellacity_upgrade_flow_context";
/** Persists resolved context for the billing visit (Strict Mode–safe). */
export const BILLING_UPGRADE_SESSION_KEY = "tellacity_upgrade_flow_ctx";

/** After Paystack success, redirect here when checkout included `return_to` (dashboard photos). */
export const POST_CHECKOUT_REDIRECT_SESSION_KEY = "tellacity_post_checkout_path";

const VALID = new Set<UpgradeFlowContext>([
  "upload_limit",
  "section_locked",
  "publish_lock",
  "general",
]);

export const UPGRADE_FLOW_BILLING_PATH = "/business/dashboard/billing" as const;

/** Primary query key for upgrade intent on billing / pricing entry. */
export const UPGRADE_SOURCE_QUERY_PARAM = "source" as const;

/** Legacy param (still read when resolving context). */
export const UPGRADE_FLOW_QUERY_PARAM = "upgrade_flow" as const;

export function isUpgradeFlowContext(raw: string | null | undefined): raw is UpgradeFlowContext {
  const v = (raw ?? "").trim().toLowerCase();
  return VALID.has(v as UpgradeFlowContext);
}

export function getUpgradeFlowMessage(context: UpgradeFlowContext): string {
  switch (context) {
    case "upload_limit":
      return "You need more photos";
    case "section_locked":
      return "Unlock more sections";
    case "publish_lock":
      return "Edit published photos sooner";
    case "general":
    default:
      return "Upgrade your plan for more features";
  }
}

/**
 * Persists upgrade intent and navigates to billing (full navigation, no confirmation).
 * Uses `?source=<context>` plus localStorage/session helpers used by billing and pricing.
 * Sets post-checkout redirect to dashboard photos so Paystack return can send the user back.
 */
export function openUpgradeFlow(context: UpgradeFlowContext): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BILLING_UPGRADE_SESSION_KEY);
    window.localStorage.setItem(STORAGE_KEY, context);
    window.sessionStorage.setItem(
      POST_CHECKOUT_REDIRECT_SESSION_KEY,
      "/business/dashboard/settings/photos"
    );
  } catch {
    // ignore
  }
  const qs = new URLSearchParams({ [UPGRADE_SOURCE_QUERY_PARAM]: context });
  window.location.assign(`${UPGRADE_FLOW_BILLING_PATH}?${qs.toString()}`);
}

export function clearBillingUpgradeContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BILLING_UPGRADE_SESSION_KEY);
  } catch {
    // ignore
  }
}

/** Moves intent from `openUpgradeFlow` localStorage into session storage for the billing page. */
export function consumeUpgradeFlowFromLocalStorage(): UpgradeFlowContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!isUpgradeFlowContext(raw)) return null;
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.setItem(BILLING_UPGRADE_SESSION_KEY, raw);
    return raw;
  } catch {
    return null;
  }
}

export function clearUpgradeFlowLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** First non-empty `source` or legacy `upgrade_flow` query value. */
export function readUpgradeSourceFromSearchParams(searchParams: {
  get(name: string): string | null;
}): UpgradeFlowContext | null {
  const a = searchParams.get(UPGRADE_SOURCE_QUERY_PARAM);
  if (isUpgradeFlowContext(a)) return a;
  const b = searchParams.get(UPGRADE_FLOW_QUERY_PARAM);
  if (isUpgradeFlowContext(b)) return b;
  return null;
}
