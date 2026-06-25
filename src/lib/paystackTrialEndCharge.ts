import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm } from "@/lib/billingPlanConfirm";
import { isPaystackCardOnTrialEnabled } from "@/lib/paystackCardOnTrial";
import {
  chargePaystackAuthorization,
  verifyPaystackAuthorizationCharge,
} from "@/lib/paystackAuthorizationCharge";
import {
  applyPaystackGrowPaymentSuccess,
  hasSuccessfulBillingTransaction,
} from "@/lib/paystackGrowPaymentSuccess";
import { PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE } from "@/lib/paystackRenewalConstants";
import { isTrialEndChargeCancelled } from "@/lib/paystackSubscriptionCancelGuards";
import { syncBusinessPlanColumn } from "@/lib/subscriptionWrite";

export { PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE };

const GROW_TRIAL_END_CYCLE = "monthly" as const;

export type CardOnTrialSubscriptionRow = {
  business_id?: string;
  plan_code?: string | null;
  status?: string | null;
  provider?: string | null;
  provider_sub_id?: string | null;
  current_period_end?: string | null;
  pending_plan_code?: string | null;
  pending_change_at?: string | null;
  paystack_authorization_code?: string | null;
  paystack_customer_email?: string | null;
  trial_end_charge_reference?: string | null;
  trial_end_charge_failed_at?: string | null;
  reverse_trial_used_at?: string | null;
  cancelled_at?: string | null;
  recurring_billing_enabled?: boolean | null;
};

/**
 * Card-on-trial discriminator: trialing + saved Paystack authorization (Build 1).
 * Legacy no-card trials have paystack_authorization_code null.
 */
export function isPaystackCardOnTrialSubscriptionRow(
  row: CardOnTrialSubscriptionRow,
): boolean {
  const status = String(row.status ?? "").trim().toLowerCase();
  const auth = row.paystack_authorization_code?.trim() ?? "";
  return status === "trialing" && auth.length > 0;
}

export function buildTrialEndChargeReference(businessId: string): string {
  return `tellacity_trial_end_${businessId.slice(0, 8)}_${Date.now()}`;
}

async function markTrialEndChargeFailed(
  db: SupabaseClient,
  businessId: string,
  reference: string,
  message: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await db
    .from("subscriptions")
    .update({
      status: "past_due",
      trial_end_charge_reference: reference,
      trial_end_charge_failed_at: now,
      trial_end_charge_failure_message: message.slice(0, 2000),
      updated_at: now,
    })
    .eq("business_id", businessId)
    .eq("status", "trialing");

  if (error) {
    console.error("[paystackTrialEndCharge] mark failed:", businessId, error.message);
  }

  await syncBusinessPlanColumn(db, businessId, "free");
}

export type TrialEndChargeResult =
  | { outcome: "converted" }
  | { outcome: "failed" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "error"; error: string };

/**
 * Charge saved card at trial end (FEATURE_PAYSTACK_CARD_ON_TRIAL only).
 * Idempotent: billing_transactions success, existing reference verify, or past_due flag.
 */
export async function attemptPaystackTrialEndCharge(
  db: SupabaseClient,
  businessId: string,
  row: CardOnTrialSubscriptionRow,
): Promise<TrialEndChargeResult> {
  if (!isPaystackCardOnTrialEnabled()) {
    return { outcome: "skipped", reason: "feature_disabled" };
  }

  if (!isPaystackCardOnTrialSubscriptionRow(row)) {
    return { outcome: "skipped", reason: "not_card_on_trial" };
  }

  const status = String(row.status ?? "").trim().toLowerCase();
  if (status !== "trialing") {
    if (status === "active" && row.provider === "paystack") {
      return { outcome: "skipped", reason: "already_converted" };
    }
    return { outcome: "skipped", reason: `status_${status || "unknown"}` };
  }

  if (row.trial_end_charge_failed_at) {
    return { outcome: "skipped", reason: "charge_already_failed" };
  }

  if (isTrialEndChargeCancelled(row)) {
    return { outcome: "skipped", reason: "cancelled" };
  }

  const authCode = row.paystack_authorization_code?.trim() ?? "";
  const email = row.paystack_customer_email?.trim() ?? "";
  if (!authCode || !email.includes("@")) {
    return { outcome: "error", error: "Missing saved Paystack authorization." };
  }

  const charge = await resolvePaystackChargeDetails("grow", GROW_TRIAL_END_CYCLE);
  const existingRef = row.trial_end_charge_reference?.trim() ?? "";

  if (existingRef && (await hasSuccessfulBillingTransaction(db, existingRef))) {
    const applied = await applyPaystackGrowPaymentSuccess(db, {
      businessId,
      reference: existingRef,
      amountMinor: charge.amountMinor,
      currency: charge.currency,
      previousPlan: "grow",
    });
    if (!applied.ok) {
      return { outcome: "error", error: applied.error };
    }
    return { outcome: "converted" };
  }

  if (existingRef) {
    const verified = await verifyPaystackAuthorizationCharge({
      reference: existingRef,
      businessId,
      expectedPurpose: PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
      expectedAmountMinor: charge.amountMinor,
      expectedCurrency: charge.currency,
      notSuccessfulMessage: "Trial-end charge not successful.",
      purposeMismatchMessage: "Transaction is not a trial-end conversion.",
    });
    if (verified.ok) {
      const applied = await applyPaystackGrowPaymentSuccess(db, {
        businessId,
        reference: existingRef,
        amountMinor: verified.amountMinor,
        currency: verified.currency,
        previousPlan: "grow",
      });
      if (!applied.ok) {
        return { outcome: "error", error: applied.error };
      }
      return { outcome: "converted" };
    }
    if (!row.trial_end_charge_failed_at) {
      await markTrialEndChargeFailed(
        db,
        businessId,
        existingRef,
        verified.ok === false ? verified.error : "Prior trial-end charge incomplete.",
      );
    }
    return { outcome: "failed" };
  }

  const reference = buildTrialEndChargeReference(businessId);
  const now = new Date().toISOString();

  const { data: claimed, error: claimErr } = await db
    .from("subscriptions")
    .update({
      trial_end_charge_reference: reference,
      updated_at: now,
    })
    .eq("business_id", businessId)
    .eq("status", "trialing")
    .is("trial_end_charge_failed_at", null)
    .is("trial_end_charge_reference", null)
    .select("id")
    .maybeSingle();

  if (claimErr) {
    return { outcome: "error", error: claimErr.message };
  }
  if (!claimed) {
    return { outcome: "skipped", reason: "charge_in_progress_or_claimed" };
  }

  let chargeResult: Awaited<ReturnType<typeof chargePaystackAuthorization>>;
  try {
    chargeResult = await chargePaystackAuthorization({
      authorizationCode: authCode,
      email,
      amountMinor: charge.amountMinor,
      currency: charge.currency,
      reference,
      businessId,
      planCode: "grow",
      billingCycle: GROW_TRIAL_END_CYCLE,
      purpose: PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "charge_authorization error";
    await markTrialEndChargeFailed(db, businessId, reference, msg);
    return { outcome: "failed" };
  }

  if (!chargeResult.ok) {
    await markTrialEndChargeFailed(
      db,
      businessId,
      chargeResult.reference,
      chargeResult.error,
    );
    return { outcome: "failed" };
  }

  const verified = await verifyPaystackAuthorizationCharge({
    reference: chargeResult.reference,
    businessId,
    expectedPurpose: PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
    expectedAmountMinor: charge.amountMinor,
    expectedCurrency: charge.currency,
    notSuccessfulMessage: "Trial-end charge not successful.",
    purposeMismatchMessage: "Transaction is not a trial-end conversion.",
  });
  if (!verified.ok) {
    await markTrialEndChargeFailed(db, businessId, chargeResult.reference, verified.error);
    return { outcome: "failed" };
  }

  const applied = await applyPaystackGrowPaymentSuccess(db, {
    businessId,
    reference: chargeResult.reference,
    amountMinor: verified.amountMinor,
    currency: verified.currency,
    previousPlan: "grow",
  });

  if (!applied.ok) {
    return { outcome: "error", error: applied.error };
  }

  console.info("[paystackTrialEndCharge] converted", {
    businessId,
    reference: chargeResult.reference,
    amountMinor: verified.amountMinor,
    currency: verified.currency,
  });

  return { outcome: "converted" };
}
