import type { SupabaseClient } from "@supabase/supabase-js";
import { PAID_PLAN_USD, type PaidPlanKey } from "@/lib/billingPlanConfirm";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";

/**
 * Paystack has a hard minimum charge. We keep the net charge at or above this
 * value in USD minor units (USD cents) and convert to the charge currency later.
 * $1.00 USD → 100 cents.
 */
export const MIN_CHARGE_USD_MINOR = 100 as const;

const PAID_KEY_RANK: Record<PaidPlanKey, number> = {
  grow: 1,
  premium: 2,
  elite: 3,
};

const PLAN_KEY_RANK: Record<PlanKey, number> = {
  free: 0,
  grow: 1,
  premium: 2,
  elite: 3,
};

export type BillingCredit = {
  id: string;
  business_id: string;
  amount_usd_minor: number;
  remaining_usd_minor: number;
  status: "available" | "pending" | "consumed" | "void";
  source: "proration" | "manual" | "refund" | "other";
  previous_plan_code: string | null;
  new_plan_code: string | null;
  reference: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  consumed_at: string | null;
};

/**
 * True when moving `from` → `to` is a tier increase among paid plans
 * (free→paid also counts as "upgrade" but yields no proration credit).
 */
export function isUpgrade(
  from: PlanKey | null | undefined,
  to: PaidPlanKey
): boolean {
  const src = from ?? "free";
  return PLAN_KEY_RANK[to] > PLAN_KEY_RANK[src];
}

/**
 * Compute the pro-rata refund owed for switching off `currentPlan` mid-cycle.
 * Returns USD minor units (cents). Zero when:
 *  - current plan is not paid,
 *  - we don't know the current period end,
 *  - period has already elapsed.
 *
 * Formula:
 *   creditUsd = currentMonthlyUsd × min(1, daysRemaining / cycleDays)
 * where cycleDays = 30 for monthly and 365 for annual.
 */
export function computeProrationCreditUsdMinor(params: {
  currentPlan: PlanKey | null | undefined;
  currentCycle: "monthly" | "annual";
  currentPeriodEndIso: string | null | undefined;
  now?: Date;
}): number {
  const { currentPlan, currentCycle, currentPeriodEndIso } = params;
  const now = params.now ?? new Date();

  if (!currentPlan || currentPlan === "free") return 0;
  const paid = currentPlan as PaidPlanKey;
  if (!(paid in PAID_KEY_RANK)) return 0;

  if (!currentPeriodEndIso) return 0;
  const endMs = new Date(currentPeriodEndIso).getTime();
  if (!Number.isFinite(endMs)) return 0;

  const remainingMs = endMs - now.getTime();
  if (remainingMs <= 0) return 0;

  const cycleDays = currentCycle === "annual" ? 365 : 30;
  const daysRemaining = remainingMs / (1000 * 60 * 60 * 24);
  const unused = Math.max(0, Math.min(1, daysRemaining / cycleDays));
  if (unused <= 0) return 0;

  const row = PAID_PLAN_USD[paid];
  const currentMajor = currentCycle === "annual" ? row.annualPerMonth * 12 : row.monthly;
  const creditMajor = currentMajor * unused;
  return Math.max(0, Math.round(creditMajor * 100));
}

/** Read the most recent active/trialing subscription metadata for a business. */
export async function fetchActiveSubscriptionMeta(
  db: SupabaseClient,
  businessId: string
): Promise<{
  planCode: string | null;
  planKey: PlanKey;
  currentPeriodEnd: string | null;
} | null> {
  const { data, error } = await db
    .from("subscriptions")
    .select("plan_code, status, updated_at, current_period_end")
    .eq("business_id", businessId)
    .in("status", ["active", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("[billingCredits] subscription lookup:", error.message);
    return null;
  }
  if (!data) return null;

  const planCode =
    typeof (data as { plan_code?: unknown }).plan_code === "string"
      ? ((data as { plan_code: string }).plan_code || null)
      : null;
  const currentPeriodEnd =
    typeof (data as { current_period_end?: unknown }).current_period_end === "string"
      ? ((data as { current_period_end: string }).current_period_end || null)
      : null;

  return {
    planCode,
    planKey: normalizePlanCodeToKey(planCode),
    currentPeriodEnd,
  };
}

/**
 * Mint (or reuse) a proration credit row for `businessId` tied to the subscription
 * period. Idempotent — safe to call on every /initialize. Returns the live row.
 */
export async function ensureProrationCredit(
  db: SupabaseClient,
  params: {
    businessId: string;
    previousPlan: PlanKey;
    newPlan: PaidPlanKey;
    currentCycle: "monthly" | "annual";
    currentPeriodEndIso: string;
    amountUsdMinor: number;
  }
): Promise<BillingCredit | null> {
  if (params.amountUsdMinor <= 0) return null;

  // Re-use a live proration credit for the same period if one already exists.
  const { data: existing, error: existingErr } = await db
    .from("billing_credits")
    .select("*")
    .eq("business_id", params.businessId)
    .eq("source", "proration")
    .eq("current_period_end", params.currentPeriodEndIso)
    .in("status", ["available", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingErr && existing) {
    return existing as BillingCredit;
  }

  const { data: inserted, error: insertErr } = await db
    .from("billing_credits")
    .insert({
      business_id: params.businessId,
      amount_usd_minor: params.amountUsdMinor,
      remaining_usd_minor: params.amountUsdMinor,
      status: "available",
      source: "proration",
      previous_plan_code: params.previousPlan,
      new_plan_code: params.newPlan,
      current_period_end: params.currentPeriodEndIso,
    })
    .select("*")
    .single();

  if (insertErr) {
    // Unique-index race: another request just minted the credit; fetch it.
    const { data: raced } = await db
      .from("billing_credits")
      .select("*")
      .eq("business_id", params.businessId)
      .eq("source", "proration")
      .eq("current_period_end", params.currentPeriodEndIso)
      .in("status", ["available", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return raced ? (raced as BillingCredit) : null;
  }

  return inserted as BillingCredit;
}

/** Sum of USD-minor credit remaining that can still be applied at checkout. */
export async function availableCreditsUsdMinor(
  db: SupabaseClient,
  businessId: string
): Promise<{ total: number; rows: BillingCredit[] }> {
  const { data, error } = await db
    .from("billing_credits")
    .select("*")
    .eq("business_id", businessId)
    .in("status", ["available", "pending"])
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[billingCredits] read available:", error.message);
    return { total: 0, rows: [] };
  }
  const rows = (data ?? []) as BillingCredit[];
  const total = rows.reduce((acc, r) => acc + Math.max(0, r.remaining_usd_minor), 0);
  return { total, rows };
}

/** Selection of credit rows + amounts to consume against a given list price. */
export type CreditApplication = {
  totalAppliedUsdMinor: number;
  perCredit: Array<{ id: string; amountUsdMinor: number }>;
};

/**
 * Greedy-oldest-first selection of credits up to `cap` USD minor.
 * Caller is responsible for persisting the selection via {@link reserveCreditSelection}
 * and finalising via {@link markCreditsConsumed} at verify time.
 */
export function selectCreditsForCharge(
  rows: BillingCredit[],
  capUsdMinor: number
): CreditApplication {
  if (capUsdMinor <= 0 || rows.length === 0) {
    return { totalAppliedUsdMinor: 0, perCredit: [] };
  }
  let remaining = capUsdMinor;
  const perCredit: CreditApplication["perCredit"] = [];
  for (const row of rows) {
    if (remaining <= 0) break;
    const take = Math.min(row.remaining_usd_minor, remaining);
    if (take <= 0) continue;
    perCredit.push({ id: row.id, amountUsdMinor: take });
    remaining -= take;
  }
  return {
    totalAppliedUsdMinor: perCredit.reduce((acc, c) => acc + c.amountUsdMinor, 0),
    perCredit,
  };
}

/**
 * Atomically move selected credits to `status='pending'` and tag them with the
 * Paystack reference. Prevents the same credit from being double-spent across
 * parallel checkout attempts.
 */
export async function reserveCreditSelection(
  db: SupabaseClient,
  selection: CreditApplication,
  reference: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (selection.totalAppliedUsdMinor <= 0) return { ok: true };

  for (const item of selection.perCredit) {
    const { error } = await db
      .from("billing_credits")
      .update({ status: "pending", reference })
      .eq("id", item.id)
      .in("status", ["available", "pending"]);
    if (error) {
      return { ok: false, error: error.message };
    }
  }
  return { ok: true };
}

/**
 * Called after Paystack verify succeeds. Decrements `remaining_usd_minor` and
 * flips fully-drained credits to `consumed`. Safe to call more than once for
 * the same reference (only `pending` rows tagged with the reference are touched).
 */
export async function markCreditsConsumed(
  db: SupabaseClient,
  reference: string
): Promise<void> {
  const { data, error } = await db
    .from("billing_credits")
    .select("id, remaining_usd_minor")
    .eq("reference", reference)
    .eq("status", "pending");

  if (error) {
    console.warn("[billingCredits] fetch pending for consume:", error.message);
    return;
  }

  const rows = (data ?? []) as Array<{ id: string; remaining_usd_minor: number }>;
  const nowIso = new Date().toISOString();

  for (const row of rows) {
    const { error: updateErr } = await db
      .from("billing_credits")
      .update({
        remaining_usd_minor: 0,
        status: "consumed",
        consumed_at: nowIso,
      })
      .eq("id", row.id)
      .eq("status", "pending");
    if (updateErr) {
      console.warn("[billingCredits] mark consumed:", updateErr.message);
    }
  }
}

/** Release any `pending` credits tagged with `reference` back to `available`. */
export async function releasePendingCredits(
  db: SupabaseClient,
  reference: string
): Promise<void> {
  const { error } = await db
    .from("billing_credits")
    .update({ status: "available", reference: null })
    .eq("reference", reference)
    .eq("status", "pending");
  if (error) {
    console.warn("[billingCredits] release pending:", error.message);
  }
}
