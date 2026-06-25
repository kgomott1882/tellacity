import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { computePaystackCurrentPeriodEndIso } from "@/lib/paystackSubscriptionPeriod";
import { getActivePlanCodeForBusiness } from "@/lib/plans";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

export type ApplyPaystackGrowPaymentArgs = {
  businessId: string;
  reference: string;
  amountMinor: number;
  currency: string;
  cycle?: "monthly" | "annual";
  /** Audit old_plan; defaults to resolved active plan. */
  previousPlan?: string;
};

/**
 * Mirror paystack/verify success: billing_transactions + active subscription + audit.
 * Used by checkout verify and card-on-trial day-14 conversion.
 */
export async function applyPaystackGrowPaymentSuccess(
  db: SupabaseClient,
  args: ApplyPaystackGrowPaymentArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const plan: PaidPlanKey = "grow";
  const cycle = args.cycle ?? "monthly";
  const businessId = args.businessId.trim();
  const reference = args.reference.trim();

  const ledger = await upsertSuccessfulBillingTransaction(db, {
    businessId,
    reference,
    amountMinor: args.amountMinor,
    currency: args.currency,
    planCode: plan,
  });
  if (!ledger.ok) {
    return ledger;
  }

  const currentPeriodEndIso = computePaystackCurrentPeriodEndIso(cycle);

  const sub = await upsertActiveSubscriptionForBusiness(db, {
    businessId,
    planCode: plan,
    provider: "paystack",
    providerSubId: reference,
    currentPeriodEndIso,
  });

  if (!sub.ok) {
    return { ok: false, error: sub.error };
  }

  const now = new Date().toISOString();
  const { error: clearErr } = await db
    .from("subscriptions")
    .update({
      trial_end_charge_failed_at: null,
      trial_end_charge_failure_message: null,
      updated_at: now,
    })
    .eq("business_id", businessId);

  if (clearErr) {
    console.warn("[paystackGrowPaymentSuccess] clear failure flags:", clearErr.message);
  }

  await syncBusinessPlanColumn(db, businessId, plan);

  const oldPlan =
    args.previousPlan ?? (await getActivePlanCodeForBusiness(businessId, db));

  const { error: auditError } = await db.from("subscription_changes").insert({
    business_id: businessId,
    old_plan: oldPlan,
    new_plan: plan,
  });
  if (auditError) {
    console.warn("[paystackGrowPaymentSuccess] subscription_changes:", auditError.message);
  }

  return { ok: true };
}

export type BillingTransactionUpsertArgs = {
  businessId: string;
  reference: string;
  amountMinor: number;
  currency: string;
  planCode: string;
};

/**
 * Record a successful Paystack charge in billing_transactions before mutating subscription access.
 * Fails closed: callers must not roll period / convert plan until this succeeds (cron can retry via Paystack verify).
 */
export async function upsertSuccessfulBillingTransaction(
  db: SupabaseClient,
  args: BillingTransactionUpsertArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const businessId = args.businessId.trim();
  const reference = args.reference.trim();
  if (!businessId || !reference) {
    return { ok: false, error: "Missing business or billing reference." };
  }

  if (await hasSuccessfulBillingTransaction(db, reference)) {
    return { ok: true };
  }

  const { error: transactionError } = await db.from("billing_transactions").upsert(
    {
      business_id: businessId,
      reference,
      amount: args.amountMinor,
      currency: args.currency,
      status: "success",
      plan_code: args.planCode,
    },
    { onConflict: "reference", ignoreDuplicates: true },
  );

  if (transactionError) {
    console.error("[billing_transactions] upsert failed:", reference, transactionError.message);
    return { ok: false, error: `billing_transactions: ${transactionError.message}` };
  }

  if (!(await hasSuccessfulBillingTransaction(db, reference))) {
    const msg = "billing_transactions row missing after upsert";
    console.error("[billing_transactions]", msg, reference);
    return { ok: false, error: msg };
  }

  return { ok: true };
}

/** True when billing_transactions already recorded this reference as success. */
export async function hasSuccessfulBillingTransaction(
  db: SupabaseClient,
  reference: string,
): Promise<boolean> {
  const ref = reference.trim();
  if (!ref) return false;

  const { data, error } = await db
    .from("billing_transactions")
    .select("status")
    .eq("reference", ref)
    .maybeSingle();

  if (error || !data) return false;
  return String((data as { status?: string }).status ?? "").toLowerCase() === "success";
}
