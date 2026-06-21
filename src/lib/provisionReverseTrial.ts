import type { SupabaseClient } from "@supabase/supabase-js";
import { getActivePlanKeyForBusiness } from "@/lib/plans";
import { syncBusinessPlanColumn } from "@/lib/subscriptionWrite";

const TRIAL_DAYS = 14;
const TRIAL_PLAN = "grow" as const;

export type ProvisionReverseTrialResult =
  | { provisioned: true }
  | {
      provisioned: false;
      reason: "not_free" | "subscription_exists" | "insert_failed" | "error";
    };

/** Why a business cannot start a user-triggered reverse trial (API / plans UI). */
export type ReverseTrialIneligibilityReason =
  | "not_free"
  | "already_trialed"
  | "paid_or_real_subscription"
  | "multiple_subscription_rows"
  | "lookup_error";

export type ReverseTrialEligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: ReverseTrialIneligibilityReason };

type SubscriptionRowSnapshot = {
  id?: string | null;
  plan_code?: string | null;
  status?: string | null;
  provider_sub_id?: string | null;
  current_period_end?: string | null;
};

function trialProviderSubId(businessId: string): string {
  return `trial:${businessId}`;
}

function trialPeriodEndIso(from: Date = new Date()): string {
  return new Date(from.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Shape-based placeholder: no real paid/trial subscription yet.
 * provider_sub_id format is ignored (tellacity:, manual_, admin:, etc.).
 */
function isShapePlaceholderRow(row: SubscriptionRowSnapshot): boolean {
  const planCode = String(row.plan_code ?? "").trim().toLowerCase();
  const status = String(row.status ?? "").trim().toLowerCase();
  const periodEnd = row.current_period_end;

  return (
    planCode === "free" &&
    status === "active" &&
    (periodEnd == null || String(periodEnd).trim() === "")
  );
}

function hasTrialMarkerRow(rows: SubscriptionRowSnapshot[]): boolean {
  return rows.some((row) => {
    const providerSubId = String(row.provider_sub_id ?? "").trim();
    return providerSubId.startsWith("trial:");
  });
}

function summarizeSubscriptionRows(rows: SubscriptionRowSnapshot[]) {
  return rows.map((row) => ({
    id: row.id ?? null,
    plan_code: row.plan_code ?? null,
    status: row.status ?? null,
    provider_sub_id: row.provider_sub_id ?? null,
    current_period_end: row.current_period_end ?? null,
  }));
}

async function finalizeReverseTrialProvision(
  db: SupabaseClient,
  businessId: string,
  currentPeriodEnd: string,
  mode: "insert" | "update",
): Promise<void> {
  await syncBusinessPlanColumn(db, businessId, TRIAL_PLAN);

  const { error: auditErr } = await db.from("subscription_changes").insert({
    business_id: businessId,
    old_plan: "free",
    new_plan: TRIAL_PLAN,
  });
  if (auditErr) {
    console.warn(
      "[provisionReverseTrial] subscription_changes (reverse_trial):",
      auditErr.message,
    );
  } else {
    console.info("[provisionReverseTrial] reverse_trial provisioned", {
      businessId,
      mode,
      plan_code: TRIAL_PLAN,
      status: "trialing",
      provider_sub_id: trialProviderSubId(businessId),
      current_period_end: currentPeriodEnd,
    });
  }
}

/**
 * Whether a business may start a user-triggered 14-day Grow trial.
 * Mirrors the guards in {@link provisionReverseTrialIfEligible} for route/UI use.
 */
export async function getReverseTrialEligibility(
  businessId: string,
  db: SupabaseClient,
): Promise<ReverseTrialEligibilityResult> {
  const trimmedId = businessId.trim();
  if (!trimmedId) {
    return { eligible: false, reason: "lookup_error" };
  }

  const planKey = await getActivePlanKeyForBusiness(trimmedId, db);
  if (planKey !== "free") {
    return { eligible: false, reason: "not_free" };
  }

  const { data: existingRows, error: existingErr } = await db
    .from("subscriptions")
    .select("id, plan_code, status, provider_sub_id, current_period_end")
    .eq("business_id", trimmedId);

  if (existingErr) {
    console.error("[provisionReverseTrial] eligibility lookup:", existingErr.message);
    return { eligible: false, reason: "lookup_error" };
  }

  const rows = (existingRows ?? []) as SubscriptionRowSnapshot[];

  if (hasTrialMarkerRow(rows)) {
    return { eligible: false, reason: "already_trialed" };
  }

  if (rows.length === 0) {
    return { eligible: true };
  }

  if (rows.length === 1 && isShapePlaceholderRow(rows[0]!)) {
    return { eligible: true };
  }

  if (rows.length > 1) {
    return { eligible: false, reason: "multiple_subscription_rows" };
  }

  return { eligible: false, reason: "paid_or_real_subscription" };
}

/**
 * Provisions a one-time 14-day Grow reverse trial on demand (user-triggered).
 * Never throws — callers must not block the caller on failure.
 */
export async function provisionReverseTrialIfEligible(
  businessId: string,
  db: SupabaseClient,
): Promise<ProvisionReverseTrialResult> {
  try {
    const trimmedId = businessId.trim();
    if (!trimmedId) {
      return { provisioned: false, reason: "error" };
    }

    const planKey = await getActivePlanKeyForBusiness(trimmedId, db);
    if (planKey !== "free") {
      console.info("[provisionReverseTrial] skipped", {
        businessId: trimmedId,
        reason: "not_free",
        resolvedPlan: planKey,
      });
      return { provisioned: false, reason: "not_free" };
    }

    const { data: existingRows, error: existingErr } = await db
      .from("subscriptions")
      .select("id, plan_code, status, provider_sub_id, current_period_end")
      .eq("business_id", trimmedId);

    if (existingErr) {
      console.error("[provisionReverseTrial] existing lookup:", existingErr.message);
      return { provisioned: false, reason: "error" };
    }

    const rows = (existingRows ?? []) as SubscriptionRowSnapshot[];
    const now = new Date().toISOString();
    const periodEnd = trialPeriodEndIso();

    if (hasTrialMarkerRow(rows)) {
      console.info("[provisionReverseTrial] skipped", {
        businessId: trimmedId,
        reason: "subscription_exists",
        note: "trial marker present (already_trialed)",
        existingRows: summarizeSubscriptionRows(rows),
      });
      return { provisioned: false, reason: "subscription_exists" };
    }

    if (rows.length === 0) {
      const insertPayload = {
        business_id: trimmedId,
        plan_code: TRIAL_PLAN,
        status: "trialing",
        provider: "tellacity",
        provider_sub_id: trialProviderSubId(trimmedId),
        current_period_end: periodEnd,
        updated_at: now,
      };

      const { data: inserted, error: insertErr } = await db
        .from("subscriptions")
        .insert(insertPayload)
        .select("id")
        .maybeSingle();

      if (insertErr) {
        console.error("[provisionReverseTrial] insert:", insertErr.message);
        return { provisioned: false, reason: "insert_failed" };
      }

      if (!inserted) {
        console.info("[provisionReverseTrial] skipped", {
          businessId: trimmedId,
          reason: "subscription_exists",
          rowCount: 0,
          note: "insert returned no row",
        });
        return { provisioned: false, reason: "subscription_exists" };
      }

      await finalizeReverseTrialProvision(db, trimmedId, periodEnd, "insert");
      return { provisioned: true };
    }

    if (rows.length === 1 && isShapePlaceholderRow(rows[0]!)) {
      const rowId = rows[0]!.id;
      if (!rowId) {
        console.info("[provisionReverseTrial] skipped", {
          businessId: trimmedId,
          reason: "subscription_exists",
          existingRows: summarizeSubscriptionRows(rows),
          note: "placeholder row missing id",
        });
        return { provisioned: false, reason: "subscription_exists" };
      }

      const updatePayload = {
        plan_code: TRIAL_PLAN,
        status: "trialing",
        provider: "tellacity",
        provider_sub_id: trialProviderSubId(trimmedId),
        current_period_end: periodEnd,
        updated_at: now,
      };

      const { data: updated, error: updateErr } = await db
        .from("subscriptions")
        .update(updatePayload)
        .eq("id", rowId)
        .eq("business_id", trimmedId)
        .select("id")
        .maybeSingle();

      if (updateErr) {
        console.error("[provisionReverseTrial] update:", updateErr.message);
        return { provisioned: false, reason: "insert_failed" };
      }

      if (!updated) {
        console.info("[provisionReverseTrial] skipped", {
          businessId: trimmedId,
          reason: "subscription_exists",
          existingRows: summarizeSubscriptionRows(rows),
          note: "placeholder update matched no row",
        });
        return { provisioned: false, reason: "subscription_exists" };
      }

      await finalizeReverseTrialProvision(db, trimmedId, periodEnd, "update");
      return { provisioned: true };
    }

    console.info("[provisionReverseTrial] skipped", {
      businessId: trimmedId,
      reason: "subscription_exists",
      rowCount: rows.length,
      existingRows: summarizeSubscriptionRows(rows),
    });
    return { provisioned: false, reason: "subscription_exists" };
  } catch (e) {
    console.error("[provisionReverseTrial] unhandled:", e);
    return { provisioned: false, reason: "error" };
  }
}
