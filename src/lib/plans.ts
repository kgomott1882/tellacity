import type { SupabaseClient } from "@supabase/supabase-js";
import { reconcileSubscriptionPeriodEnd } from "@/lib/subscriptionExpiry";
import { WEBSITE_WIDGETS } from "@/lib/widgetsConfig";

export type PlanKey = "free" | "grow" | "premium" | "elite";

export const PLAN_INVITE_LIMITS: Record<PlanKey, number> = {
  free: 10,
  grow: 300,
  premium: 1500,
  elite: 3000,
};

/**
 * Maximum TOTAL number of profile photos allowed per plan, across ALL sections.
 * Users can freely distribute photos across categories, we only enforce the total.
 */
export const PLAN_PHOTO_LIMITS: Record<PlanKey, number> = {
  free: 4,
  grow: 25,
  premium: 75,
  elite: 150,
};

/** Monthly article submissions (consumed on submit for review, not on draft). */
export const PLAN_ARTICLE_LIMITS: Record<PlanKey, number> = {
  free: 0,
  grow: 5,
  premium: 15,
  elite: 30,
};

/** Maximum counted external links per article (business website + Tellacity links exempt). */
export const PLAN_EXTERNAL_LINK_LIMITS: Record<PlanKey, number> = {
  free: 7,
  grow: 7,
  premium: 15,
  elite: 30,
};

export function getExternalLinkLimitForPlan(plan?: string | null): number {
  const key = normalizePlanCodeToKey(plan);
  return PLAN_EXTERNAL_LINK_LIMITS[key] ?? PLAN_EXTERNAL_LINK_LIMITS.free;
}

/** Admin-authored platform articles use the Elite cap. */
export const PLATFORM_ARTICLE_EXTERNAL_LINK_LIMIT = PLAN_EXTERNAL_LINK_LIMITS.elite;

export function getPhotoLimitForPlan(plan: PlanKey | null | undefined): number {
  const key = plan ?? "free";
  return PLAN_PHOTO_LIMITS[key] ?? PLAN_PHOTO_LIMITS.free;
}

/** Normalize subscription `plan_code` (e.g. business_grow_monthly) to a PlanKey. */
export function normalizePlanCodeToKey(raw: string | null | undefined): PlanKey {
  if (!raw || !String(raw).trim()) return "free";
  let normalized = String(raw).trim().toLowerCase();
  if (normalized.startsWith("business_")) {
    normalized = normalized.replace(/^business_/, "");
  }
  if (normalized.includes("_")) {
    normalized = normalized.split("_")[0]!;
  }
  if (
    normalized === "free" ||
    normalized === "grow" ||
    normalized === "premium" ||
    normalized === "elite"
  ) {
    return normalized as PlanKey;
  }
  return "free";
}

export function getInviteLimitForPlan(plan?: string): number {
  if (!plan) return PLAN_INVITE_LIMITS.free;
  const normalized = normalizePlanCodeToKey(plan);
  return PLAN_INVITE_LIMITS[normalized] ?? PLAN_INVITE_LIMITS.free;
}

/** Pricing cards / marketing: "10 review invites per month" */
export function formatPlanInviteLimitForDisplay(plan: PlanKey): string {
  return `${PLAN_INVITE_LIMITS[plan].toLocaleString("en-US")} review invites per month`;
}

/** Pricing cards / marketing: "Up to 4 photo uploads" */
export function formatPlanPhotoLimitForDisplay(plan: PlanKey): string {
  return `Up to ${PLAN_PHOTO_LIMITS[plan].toLocaleString("en-US")} photo uploads`;
}

/** Comparison table cell for monthly invite caps */
export function formatPlanInviteLimitTableCell(plan: PlanKey): string {
  return PLAN_INVITE_LIMITS[plan].toLocaleString("en-US");
}

/** Comparison table cell for total photo caps */
export function formatPlanPhotoLimitTableCell(plan: PlanKey): string {
  return PLAN_PHOTO_LIMITS[plan].toLocaleString("en-US");
}

/** Checkout confirm modal bullets */
export function upToPlanInviteLimitBullet(plan: PlanKey): string {
  return `Up to ${PLAN_INVITE_LIMITS[plan].toLocaleString("en-US")} review invites per month`;
}

export function upToPlanArticleLimitBullet(plan: PlanKey): string {
  const n = PLAN_ARTICLE_LIMITS[plan];
  const label = n === 1 ? "blog or case study" : "blogs & case studies";
  return `Up to ${n.toLocaleString("en-US")} ${label} per month`;
}

/** Upgrade confirmation modal: "10 review invites/month" */
export function formatPlanInviteLimitModal(plan: PlanKey): string {
  return `${PLAN_INVITE_LIMITS[plan].toLocaleString("en-US")} review invites/month`;
}

/** Upgrade confirmation modal: "Up to 4 photo uploads" */
export function formatPlanPhotoLimitModal(plan: PlanKey): string {
  return formatPlanPhotoLimitForDisplay(plan);
}

/** Upgrade confirmation modal: "5 blogs & case studies/month" */
export function formatPlanArticleLimitModal(plan: PlanKey): string {
  const n = PLAN_ARTICLE_LIMITS[plan];
  const label = n === 1 ? "blog or case study" : "blogs & case studies";
  return `${n.toLocaleString("en-US")} ${label}/month`;
}

/** Pricing cards: blogs & case studies submission allowance */
export function formatPlanArticleLimitForDisplay(plan: PlanKey): string {
  const n = PLAN_ARTICLE_LIMITS[plan];
  if (n <= 0) {
    return "Blogs & case studies, save drafts (publish on Grow+)";
  }
  const label = n === 1 ? "blog or case study" : "blogs or case studies";
  return `Up to ${n.toLocaleString("en-US")} ${label} per month`;
}

/** Comparison table cell for monthly blog/case study submissions */
export function formatPlanArticleLimitTableCell(plan: PlanKey): string {
  const n = PLAN_ARTICLE_LIMITS[plan];
  if (n <= 0) return "Drafts only";
  return `${n.toLocaleString("en-US")}/mo`;
}

/** Count of embeddable website widgets unlocked for a plan (see `canAccessWebsiteWidget`). */
export function countWebsiteWidgetsForPlan(plan: PlanKey): number {
  return WEBSITE_WIDGETS.filter((w) => canAccessWebsiteWidget(plan, w.planWidget)).length;
}

/** Pricing cards: "4 on-site widgets" */
export function formatPlanWebsiteWidgetLimitForDisplay(plan: PlanKey): string {
  const n = countWebsiteWidgetsForPlan(plan);
  const label = n === 1 ? "on-site widget" : "on-site widgets";
  return `${n.toLocaleString("en-US")} ${label}`;
}

/** Comparison table cell for widget counts */
export function formatPlanWebsiteWidgetLimitTableCell(plan: PlanKey): string {
  return countWebsiteWidgetsForPlan(plan).toLocaleString("en-US");
}

import {
  pickPlanResolutionSubscriptionRow,
  SUBSCRIPTION_STATUSES_FOR_PLAN,
  type PlanResolutionSubscriptionRow,
} from "@/lib/subscriptionPlanPick";

export { SUBSCRIPTION_STATUSES_FOR_PLAN, pickPlanResolutionSubscriptionRow };
export type { PlanResolutionSubscriptionRow };

async function loadSubscriptionPlanResolution(
  businessId: string,
  db: SupabaseClient
): Promise<
  | { ok: true; rawPlanCode: string | null }
  | { ok: false; error: string }
> {
  const reconciled = await reconcileSubscriptionPeriodEnd(db, businessId);
  if (!reconciled.ok) {
    return { ok: false, error: reconciled.error };
  }
  return { ok: true, rawPlanCode: reconciled.rawPlanCode };
}

async function fetchActiveSubscriptionPlanCode(
  businessId: string,
  db: SupabaseClient
): Promise<string | null> {
  const result = await loadSubscriptionPlanResolution(businessId, db);
  if (!result.ok) {
    console.error("[plans] subscriptions lookup:", result.error);
    return null;
  }
  return result.rawPlanCode;
}

export type ActivePlanKeyResult =
  | { ok: true; plan: PlanKey }
  | { ok: false; error: string };

/**
 * Same plan resolution as {@link getActivePlanKeyForBusiness}, but surfaces
 * lookup errors (e.g. for API routes that must return 5xx on DB failure).
 */
export async function getActivePlanKeyForBusinessResult(
  businessId: string,
  db: SupabaseClient
): Promise<ActivePlanKeyResult> {
  const result = await loadSubscriptionPlanResolution(businessId, db);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, plan: normalizePlanCodeToKey(result.rawPlanCode) };
}

/**
 * Resolved plan keys for many businesses in one query (same rules as
 * {@link getActivePlanKeyForBusiness}).
 */
export async function getActivePlanKeysByBusinessIds(
  businessIds: string[],
  db: SupabaseClient
): Promise<Map<string, PlanKey>> {
  const out = new Map<string, PlanKey>();
  if (businessIds.length === 0) return out;

  for (const bid of businessIds) {
    const resolved = await getActivePlanKeyForBusinessResult(bid, db);
    out.set(bid, resolved.ok ? resolved.plan : "free");
  }

  return out;
}

export type DashboardPlanContext = {
  plan: PlanKey;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
};

/**
 * Resolved plan + subscription metadata for dashboard clients.
 * One batch `subscriptions` read, then per-business reconcile (same as plan resolution).
 */
export async function getDashboardPlanContextByBusinessIds(
  businessIds: string[],
  db: SupabaseClient,
): Promise<Map<string, DashboardPlanContext>> {
  const out = new Map<string, DashboardPlanContext>();
  if (businessIds.length === 0) return out;

  const { data: subRows, error: subErr } = await db
    .from("subscriptions")
    .select(
      "business_id, plan_code, status, updated_at, current_period_end, pending_plan_code, pending_change_at, renewal_grace_ends_at",
    )
    .in("business_id", businessIds);

  const byBiz = new Map<string, PlanResolutionSubscriptionRow[]>();
  if (!subErr) {
    for (const row of subRows ?? []) {
      const bid =
        (row as { business_id?: string | null }).business_id != null
          ? String((row as { business_id?: string | null }).business_id).trim()
          : "";
      if (!bid) continue;
      const list = byBiz.get(bid) ?? [];
      list.push(row as PlanResolutionSubscriptionRow);
      byBiz.set(bid, list);
    }
  } else {
    console.error("[plans] batch subscriptions lookup:", subErr.message);
  }

  for (const bid of businessIds) {
    const reconciled = await reconcileSubscriptionPeriodEnd(db, bid);
    if (!reconciled.ok) {
      out.set(bid, { plan: "free", subscriptionStatus: null, trialEndsAt: null });
      continue;
    }

    const plan = normalizePlanCodeToKey(reconciled.rawPlanCode);

    if (reconciled.action.type !== "none") {
      out.set(bid, { plan, subscriptionStatus: "active", trialEndsAt: null });
      continue;
    }

    const picked = pickPlanResolutionSubscriptionRow(byBiz.get(bid), { now: new Date() });
    if (!picked) {
      out.set(bid, { plan, subscriptionStatus: null, trialEndsAt: null });
      continue;
    }

    const statusRaw =
      picked.status != null ? String(picked.status).trim().toLowerCase() : "";
    const subscriptionStatus = statusRaw || null;
    const periodEnd =
      picked.current_period_end != null && String(picked.current_period_end).trim()
        ? String(picked.current_period_end).trim()
        : null;
    const trialEndsAt =
      subscriptionStatus === "trialing" && periodEnd ? periodEnd : null;

    out.set(bid, { plan, subscriptionStatus, trialEndsAt });
  }

  return out;
}

/**
 * Raw `plan_code` from the subscription row used for feature resolution
 * (`active` or `trialing`), or null if none.
 */
export async function getActivePlanCodeForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<string | null> {
  return fetchActiveSubscriptionPlanCode(businessId, db);
}

/**
 * Current plan for a business: `subscriptions` with status `active` or `trialing`
 * (see {@link SUBSCRIPTION_STATUSES_FOR_PLAN}), same row selection as
 * {@link pickPlanResolutionSubscriptionRow}. If none, returns `free`.
 */
export async function getActivePlanKeyForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<PlanKey> {
  const resolved = await getActivePlanKeyForBusinessResult(businessId, db);
  if (!resolved.ok) {
    console.error("[plans] subscriptions lookup:", resolved.error);
    return "free";
  }
  return resolved.plan;
}

/** Matches admin `parseRpcNumber` for `get_bonus_invites` return shapes. */
function parseBonusInvitesRpc(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Math.max(0, Math.trunc(Number(value)));
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown> | number | string | null;
    if (typeof first === "number" || typeof first === "string") {
      return parseBonusInvitesRpc(first);
    }
    if (first && typeof first === "object") {
      if ("bonus_invites" in first) {
        return parseBonusInvitesRpc(
          (first as Record<string, unknown>).bonus_invites,
        );
      }
      if ("get_bonus_invites" in first) {
        return parseBonusInvitesRpc(
          (first as Record<string, unknown>).get_bonus_invites,
        );
      }
    }
  }
  return 0;
}

/**
 * Admin-granted bonus invites (RPC `get_bonus_invites`), same source as admin business controls.
 */
export async function getBonusInvitesForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<number> {
  const { data, error } = await db.rpc("get_bonus_invites", {
    p_business_id: businessId,
  });
  if (error) {
    console.warn("[plans] get_bonus_invites:", error.message);
    return 0;
  }
  return parseBonusInvitesRpc(data);
}

/**
 * Monthly invite cap: plan base limit + admin bonus (matches admin “Total Available”).
 */
export async function getMonthlyInviteLimitForBusiness(
  businessId: string,
  db: SupabaseClient
): Promise<number> {
  const plan = await getActivePlanKeyForBusiness(businessId, db);
  const base = PLAN_INVITE_LIMITS[plan];
  const bonus = await getBonusInvitesForBusiness(businessId, db);
  return Math.max(0, base + bonus);
}

function parseBonusArticlesRpc(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Math.max(0, Math.trunc(Number(value)));
  }
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as Record<string, unknown> | number | string | null;
    if (typeof first === "number" || typeof first === "string") {
      return parseBonusArticlesRpc(first);
    }
    if (first && typeof first === "object") {
      if ("bonus_articles" in first) {
        return parseBonusArticlesRpc(
          (first as Record<string, unknown>).bonus_articles,
        );
      }
      if ("get_bonus_articles" in first) {
        return parseBonusArticlesRpc(
          (first as Record<string, unknown>).get_bonus_articles,
        );
      }
    }
  }
  return 0;
}

export async function getBonusArticlesForBusiness(
  businessId: string,
  db: SupabaseClient,
): Promise<number> {
  const { data, error } = await db.rpc("get_bonus_articles", {
    p_business_id: businessId,
  });
  if (error) {
    console.warn("[plans] get_bonus_articles:", error.message);
    return 0;
  }
  return parseBonusArticlesRpc(data);
}

export async function getMonthlyArticleLimitForBusiness(
  businessId: string,
  db: SupabaseClient,
): Promise<number> {
  const plan = await getActivePlanKeyForBusiness(businessId, db);
  const base = PLAN_ARTICLE_LIMITS[plan];
  const bonus = await getBonusArticlesForBusiness(businessId, db);
  return Math.max(0, base + bonus);
}

export function getArticleLimitForPlan(plan: PlanKey | null | undefined): number {
  const key = plan ?? "free";
  return PLAN_ARTICLE_LIMITS[key] ?? PLAN_ARTICLE_LIMITS.free;
}

export function canSubmitArticles(plan: PlanKey): boolean {
  return PLAN_ARTICLE_LIMITS[plan] > 0;
}

export function canAccessAnalytics(plan: PlanKey) {
  return plan === "grow" || plan === "premium" || plan === "elite";
}

export function canUseCustomEmail(plan: PlanKey) {
  return plan !== "free";
}

export function canAccessEmailWidget(
  plan: PlanKey,
  widget:
    | "premium_layout"
    | "review_showcase"
    | "elite_layout"
    | "tellacity_trust_badge",
) {
  if (widget === "tellacity_trust_badge") {
    return plan === "premium" || plan === "elite";
  }
  if (widget === "review_showcase") {
    return plan === "premium" || plan === "elite";
  }
  if (plan === "free") return widget === "premium_layout";
  if (plan === "grow") return widget === "premium_layout";
  return true;
}

export function canAccessWebsiteWidget(
  plan: PlanKey,
  widget:
    | "review_collector"
    | "review_carousel"
    | "trust_badge"
    | "review_list"
    | "review_strip"
    | "tellacity_score"
    | "review_showcase"
    | "tellacity_trust"
    | "trust_strip"
    | "trust_stacked"
    | "trust_strip_icon"
    | "trust_mini"
    | "spotlight_carousel"
    | "review_slider"
    | "review_dropdown"
    | "micro_trustscore",
) {
  if (
    widget === "tellacity_trust" ||
    widget === "tellacity_score" ||
    widget === "trust_strip_icon" ||
    widget === "trust_mini"
  ) {
    return plan === "elite";
  }
  if (
    widget === "spotlight_carousel" ||
    widget === "review_slider" ||
    widget === "review_dropdown" ||
    widget === "micro_trustscore"
  ) {
    return plan === "premium" || plan === "elite";
  }
  // Review Collector in the dashboard uses `review_strip` (strip embed); treat both keys as the free-tier website widget.
  if (plan === "free") {
    return widget === "review_collector" || widget === "review_strip";
  }
  if (plan === "grow") {
    return (
      widget === "review_collector" ||
      widget === "review_strip" ||
      widget === "review_carousel" ||
      widget === "trust_badge" ||
      widget === "review_list"
    );
  }
  return true;
}

export function canAccessNotifications(plan: PlanKey) {
  return plan !== "free";
}

export function getTeamLimit(plan: PlanKey) {
  switch (plan) {
    case "free":
      return 1;
    case "grow":
      return 3;
    case "premium":
      return 10;
    case "elite":
      return Infinity;
    default:
      return 1;
  }
}

/** Primary upgrade CTA label for the next paid tier (dashboard consistency). */
export function nextTierUpgradeCtaLabel(plan: PlanKey): string {
  switch (plan) {
    case "free":
      return "Upgrade to Grow";
    case "grow":
      return "Upgrade to Premium";
    case "premium":
      return "Upgrade to Elite";
    default:
      return "Upgrade";
  }
}
