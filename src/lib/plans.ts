import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanKey = "free" | "grow" | "premium" | "elite";

export const PLAN_INVITE_LIMITS: Record<PlanKey, number> = {
  free: 20,
  grow: 150,
  premium: 500,
  elite: 3000,
};

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

/** Subscriptions that grant the current billed / feature plan (used app-wide). */
export const SUBSCRIPTION_STATUSES_FOR_PLAN = ["active", "trialing"] as const;

export type PlanResolutionSubscriptionRow = {
  plan_code?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

/**
 * When multiple subscription rows exist (e.g. active + trialing), prefer `active`,
 * then `trialing`, newest `updated_at` first within each status.
 */
export function pickPlanResolutionSubscriptionRow<
  T extends PlanResolutionSubscriptionRow,
>(rows: T[] | null | undefined): T | null {
  if (!rows?.length) return null;
  const statusRank = (s: string | null | undefined) => {
    const v = String(s ?? "").toLowerCase();
    if (v === "active") return 0;
    if (v === "trialing") return 1;
    return 2;
  };
  const time = (iso: string | null | undefined) => {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : 0;
  };
  const sorted = [...rows].sort((a, b) => {
    const dr = statusRank(a.status) - statusRank(b.status);
    if (dr !== 0) return dr;
    return time(b.updated_at) - time(a.updated_at);
  });
  const best = sorted[0];
  const st = String(best?.status ?? "").toLowerCase();
  if (st === "active" || st === "trialing") return best;
  return null;
}

type SubscriptionPlanLookupRow = {
  plan_code?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

async function loadSubscriptionPlanResolution(
  businessId: string,
  db: SupabaseClient
): Promise<
  | { ok: true; rawPlanCode: string | null }
  | { ok: false; error: string }
> {
  const { data: rows, error } = await db
    .from("subscriptions")
    .select("plan_code, status, updated_at")
    .eq("business_id", businessId)
    .in("status", [...SUBSCRIPTION_STATUSES_FOR_PLAN]);

  if (error) {
    return { ok: false, error: error.message };
  }

  const picked = pickPlanResolutionSubscriptionRow(
    rows as SubscriptionPlanLookupRow[] | null,
  );
  const code = picked?.plan_code;
  const raw =
    code != null && String(code).trim() ? String(code) : null;
  return { ok: true, rawPlanCode: raw };
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

  const { data: rows, error } = await db
    .from("subscriptions")
    .select("business_id, plan_code, status, updated_at")
    .in("business_id", businessIds)
    .in("status", [...SUBSCRIPTION_STATUSES_FOR_PLAN]);

  if (error) {
    console.error("[plans] subscriptions batch lookup:", error.message);
    return out;
  }

  const byBiz = new Map<string, PlanResolutionSubscriptionRow[]>();
  for (const row of rows ?? []) {
    const bid = (row as { business_id?: string | null }).business_id;
    if (!bid) continue;
    const list = byBiz.get(bid) ?? [];
    list.push({
      plan_code: row.plan_code as string | null,
      status: row.status as string | null,
      updated_at: (row as { updated_at?: string | null }).updated_at ?? null,
    });
    byBiz.set(bid, list);
  }

  for (const bid of businessIds) {
    const picked = pickPlanResolutionSubscriptionRow(byBiz.get(bid));
    out.set(bid, normalizePlanCodeToKey(picked?.plan_code ?? null));
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
  if (plan === "free") return widget === "premium_layout";
  if (plan === "grow")
    return widget === "premium_layout" || widget === "review_showcase";
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
    | "tellacity_trust",
) {
  if (widget === "tellacity_trust" || widget === "tellacity_score") {
    return plan === "elite";
  }
  if (plan === "free") return widget === "review_collector";
  if (plan === "grow") {
    return (
      widget === "review_collector" ||
      widget === "review_carousel" ||
      widget === "trust_badge"
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
