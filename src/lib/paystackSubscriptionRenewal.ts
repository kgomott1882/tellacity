import type { SupabaseClient } from "@supabase/supabase-js";
import { resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm } from "@/lib/billingPlanConfirm";
import { isPaystackRecurringRenewalEnabled } from "@/lib/paystackCardOnTrial";
import {
  chargePaystackAuthorization,
  verifyPaystackAuthorizationCharge,
} from "@/lib/paystackAuthorizationCharge";
import { hasSuccessfulBillingTransaction, upsertSuccessfulBillingTransaction } from "@/lib/paystackGrowPaymentSuccess";
import {
  PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
  RENEWAL_GRACE_DAYS,
  RENEWAL_MAX_RETRIES,
  RENEWAL_RETRY_DAY_OFFSETS,
} from "@/lib/paystackRenewalConstants";
import { computePaystackCurrentPeriodEndIso } from "@/lib/paystackSubscriptionPeriod";
import { normalizePlanCodeToKey } from "@/lib/plans";
import {
  isRecurringRenewalGraceActive as renewalGraceStillActive,
} from "@/lib/paystackRenewalGrace";
import { isRenewalChargeCancelled } from "@/lib/paystackSubscriptionCancelGuards";
import { isSubscriptionInstantPassed } from "@/lib/subscriptionInstant";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

/** Card-on-trial monthly renewal row (Build 2.5). */
export type RecurringRenewalSubscriptionRow = {
  business_id?: string;
  plan_code?: string | null;
  status?: string | null;
  provider?: string | null;
  current_period_end?: string | null;
  paystack_authorization_code?: string | null;
  paystack_customer_email?: string | null;
  trial_card_captured_at?: string | null;
  recurring_billing_enabled?: boolean | null;
  renewal_charge_reference?: string | null;
  renewal_charge_for_period_end?: string | null;
  renewal_failed_at?: string | null;
  renewal_failure_message?: string | null;
  renewal_retry_count?: number | null;
  renewal_next_retry_at?: string | null;
  renewal_grace_ends_at?: string | null;
  cancelled_at?: string | null;
  pending_plan_code?: string | null;
};

export type RenewalChargeResult =
  | { outcome: "renewed" }
  | { outcome: "grace_started" }
  | { outcome: "skipped"; reason: string }
  | { outcome: "claim_lost" }
  | { outcome: "error"; error: string };

/** UTC `YYYYMMDDHHmmss` from an ISO period-end boundary (idempotency anchor). */
export function formatPeriodEndUtcForReference(periodEndIso: string): string {
  const d = new Date(periodEndIso);
  if (!Number.isFinite(d.getTime())) {
    throw new Error("Invalid period end for renewal reference.");
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}` +
    `${pad(d.getUTCMonth() + 1)}` +
    `${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}` +
    `${pad(d.getUTCMinutes())}` +
    `${pad(d.getUTCSeconds())}`
  );
}

/**
 * Stable per-cycle Paystack reference derived from the expired `current_period_end`.
 * Same boundary → same reference → no double-charge within a billing cycle.
 */
export function buildRenewalChargeReference(
  businessId: string,
  periodEndIso: string,
): string {
  const suffix = formatPeriodEndUtcForReference(periodEndIso);
  return `tellacity_renew_${businessId.slice(0, 8)}_${suffix}`;
}

export function resolveRenewalBillingCycle(
  _row: RecurringRenewalSubscriptionRow,
): "monthly" | "annual" {
  // Card-on-trial is monthly Grow today; no billing_cycle column on subscriptions yet.
  return "monthly";
}

function resolveRenewalPaidPlan(row: RecurringRenewalSubscriptionRow): PaidPlanKey | null {
  const key = normalizePlanCodeToKey(row.plan_code);
  return isPaidPlanForConfirm(key) ? key : null;
}

function renewalRetryIsDue(
  row: RecurringRenewalSubscriptionRow,
  now: Date,
): boolean {
  const next = row.renewal_next_retry_at?.trim() ?? "";
  if (!next) return false;
  const t = new Date(next).getTime();
  return Number.isFinite(t) && t <= now.getTime();
}

/** Next retry instant from first failure, using {@link RENEWAL_RETRY_DAY_OFFSETS}. */
export function computeRenewalNextRetryAt(
  failedAt: Date,
  attemptsFailed: number,
): Date | null {
  if (attemptsFailed >= RENEWAL_MAX_RETRIES) return null;
  const offsetDays = RENEWAL_RETRY_DAY_OFFSETS[attemptsFailed - 1];
  if (offsetDays === undefined) return null;
  const next = new Date(failedAt.getTime());
  next.setUTCDate(next.getUTCDate() + offsetDays);
  return next;
}

/**
 * Scope boundary: only stored-card card-on-trial subs with explicit recurring consent.
 * Manual Paystack checkout rows have `paystack_authorization_code` null and never pass.
 */
export function assessPaystackSubscriptionRenewalEligibility(
  row: RecurringRenewalSubscriptionRow,
  now: Date = new Date(),
):
  | {
      eligible: true;
      periodEndIso: string;
      mode: "initial" | "retry";
      plan: PaidPlanKey;
      cycle: "monthly" | "annual";
    }
  | { eligible: false; reason: string } {
  const status = String(row.status ?? "").trim().toLowerCase();
  const auth = row.paystack_authorization_code?.trim() ?? "";
  const email = row.paystack_customer_email?.trim() ?? "";
  const trialCaptured = row.trial_card_captured_at?.trim() ?? "";

  if (auth.length === 0) {
    return { eligible: false, reason: "no_stored_authorization" };
  }
  if (!trialCaptured) {
    return { eligible: false, reason: "no_trial_card_capture" };
  }
  if (row.recurring_billing_enabled !== true) {
    return { eligible: false, reason: "recurring_not_enabled" };
  }
  if (isRenewalChargeCancelled(row)) {
    return { eligible: false, reason: "cancelled" };
  }
  if (!email.includes("@")) {
    return { eligible: false, reason: "missing_customer_email" };
  }

  const periodEndIso = row.current_period_end?.trim() ?? "";
  if (!periodEndIso || !isSubscriptionInstantPassed(periodEndIso, now)) {
    return { eligible: false, reason: "period_not_ended" };
  }

  const plan = resolveRenewalPaidPlan(row);
  if (!plan) {
    return { eligible: false, reason: "not_paid_plan" };
  }

  const cycle = resolveRenewalBillingCycle(row);

  if (status === "active") {
    if (row.renewal_failed_at) {
      return { eligible: false, reason: "grace_already_started" };
    }
    return { eligible: true, periodEndIso, mode: "initial", plan, cycle };
  }

  if (status === "past_due") {
    if (!row.renewal_failed_at) {
      return { eligible: false, reason: "past_due_without_renewal_failure" };
    }
    if (!renewalGraceStillActive(row, now)) {
      return { eligible: false, reason: "grace_expired" };
    }
    const attempts = row.renewal_retry_count ?? 0;
    if (attempts >= RENEWAL_MAX_RETRIES) {
      return { eligible: false, reason: "max_retries_reached" };
    }
    if (!renewalRetryIsDue(row, now)) {
      return { eligible: false, reason: "retry_not_due" };
    }
    const claimedPeriod = row.renewal_charge_for_period_end?.trim() ?? "";
    if (claimedPeriod !== periodEndIso) {
      return { eligible: false, reason: "retry_period_mismatch" };
    }
    return { eligible: true, periodEndIso, mode: "retry", plan, cycle };
  }

  return { eligible: false, reason: `status_${status || "unknown"}` };
}

async function applyPaystackRenewalSuccess(
  db: SupabaseClient,
  args: {
    businessId: string;
    reference: string;
    amountMinor: number;
    currency: string;
    planCode: PaidPlanKey;
    cycle: "monthly" | "annual";
    expiredPeriodEndIso: string;
    previousPlan?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const businessId = args.businessId.trim();
  const reference = args.reference.trim();

  const ledger = await upsertSuccessfulBillingTransaction(db, {
    businessId,
    reference,
    amountMinor: args.amountMinor,
    currency: args.currency,
    planCode: args.planCode,
  });
  if (!ledger.ok) {
    return ledger;
  }

  const currentPeriodEndIso = computePaystackCurrentPeriodEndIso(
    args.cycle,
    new Date(args.expiredPeriodEndIso),
  );

  const sub = await upsertActiveSubscriptionForBusiness(db, {
    businessId,
    planCode: args.planCode,
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
      renewal_charge_reference: null,
      renewal_charge_for_period_end: null,
      renewal_failed_at: null,
      renewal_failure_message: null,
      renewal_retry_count: 0,
      renewal_next_retry_at: null,
      renewal_grace_ends_at: null,
      status: "active",
      updated_at: now,
    })
    .eq("business_id", businessId);

  if (clearErr) {
    console.warn("[paystackSubscriptionRenewal] clear renewal cycle fields:", clearErr.message);
  }

  await syncBusinessPlanColumn(db, businessId, args.planCode);

  const { error: auditError } = await db.from("subscription_changes").insert({
    business_id: businessId,
    old_plan: args.previousPlan ?? args.planCode,
    new_plan: args.planCode,
  });
  if (auditError) {
    console.warn("[paystackSubscriptionRenewal] subscription_changes:", auditError.message);
  }

  return { ok: true };
}

async function markRenewalGraceStarted(
  db: SupabaseClient,
  businessId: string,
  reference: string,
  periodEndIso: string,
  message: string,
  now: Date,
): Promise<void> {
  const failedAtIso = now.toISOString();
  const graceEnds = new Date(now.getTime());
  graceEnds.setUTCDate(graceEnds.getUTCDate() + RENEWAL_GRACE_DAYS);
  const nextRetry = computeRenewalNextRetryAt(now, 1);

  const { error } = await db
    .from("subscriptions")
    .update({
      status: "past_due",
      renewal_charge_reference: reference,
      renewal_charge_for_period_end: periodEndIso,
      renewal_failed_at: failedAtIso,
      renewal_failure_message: message.slice(0, 2000),
      renewal_retry_count: 1,
      renewal_next_retry_at: nextRetry?.toISOString() ?? null,
      renewal_grace_ends_at: graceEnds.toISOString(),
      updated_at: failedAtIso,
    })
    .eq("business_id", businessId);

  if (error) {
    console.error("[paystackSubscriptionRenewal] grace start:", businessId, error.message);
  }
}

async function markRenewalRetryFailed(
  db: SupabaseClient,
  businessId: string,
  reference: string,
  periodEndIso: string,
  message: string,
  failedAtIso: string,
  previousAttempts: number,
  now: Date,
): Promise<void> {
  const attemptsFailed = previousAttempts + 1;
  const nextRetry = computeRenewalNextRetryAt(new Date(failedAtIso), attemptsFailed);

  const { error } = await db
    .from("subscriptions")
    .update({
      renewal_charge_reference: reference,
      renewal_charge_for_period_end: periodEndIso,
      renewal_failure_message: message.slice(0, 2000),
      renewal_retry_count: attemptsFailed,
      renewal_next_retry_at: nextRetry?.toISOString() ?? null,
      updated_at: now.toISOString(),
    })
    .eq("business_id", businessId);

  if (error) {
    console.error("[paystackSubscriptionRenewal] retry failed:", businessId, error.message);
  }
}

async function completeRenewalIfAlreadyPaid(
  db: SupabaseClient,
  businessId: string,
  reference: string,
  plan: PaidPlanKey,
  cycle: "monthly" | "annual",
  periodEndIso: string,
  charge: { amountMinor: number; currency: string },
): Promise<RenewalChargeResult | null> {
  if (!(await hasSuccessfulBillingTransaction(db, reference))) {
    return null;
  }

  const applied = await applyPaystackRenewalSuccess(db, {
    businessId,
    reference,
    amountMinor: charge.amountMinor,
    currency: charge.currency,
    planCode: plan,
    cycle,
    expiredPeriodEndIso: periodEndIso,
    previousPlan: plan,
  });

  if (!applied.ok) {
    return { outcome: "error", error: applied.error };
  }
  return { outcome: "renewed" };
}

/**
 * Monthly stored-card renewal (Build 2.5). Not wired to cron until Part C.
 * FEATURE_PAYSTACK_RECURRING_RENEWAL must be enabled.
 */
export async function attemptPaystackSubscriptionRenewal(
  db: SupabaseClient,
  row: RecurringRenewalSubscriptionRow,
  options?: { now?: Date },
): Promise<RenewalChargeResult> {
  if (!isPaystackRecurringRenewalEnabled()) {
    return { outcome: "skipped", reason: "feature_disabled" };
  }

  const businessId = row.business_id?.trim() ?? "";
  if (!businessId) {
    return { outcome: "error", error: "Missing business_id." };
  }

  const now = options?.now ?? new Date();
  const eligibility = assessPaystackSubscriptionRenewalEligibility(row, now);
  if (!eligibility.eligible) {
    return { outcome: "skipped", reason: eligibility.reason };
  }

  const { periodEndIso, mode, plan, cycle } = eligibility;
  const charge = await resolvePaystackChargeDetails(plan, cycle);
  const reference = buildRenewalChargeReference(businessId, periodEndIso);
  const claimedRef = row.renewal_charge_reference?.trim() ?? "";
  const claimedPeriod = row.renewal_charge_for_period_end?.trim() ?? "";

  const alreadyPaid = await completeRenewalIfAlreadyPaid(
    db,
    businessId,
    claimedPeriod === periodEndIso && claimedRef ? claimedRef : reference,
    plan,
    cycle,
    periodEndIso,
    charge,
  );
  if (alreadyPaid) {
    return alreadyPaid;
  }

  let chargeReference = reference;

  if (claimedPeriod === periodEndIso && claimedRef) {
    chargeReference = claimedRef;
    const verified = await verifyPaystackAuthorizationCharge({
      reference: claimedRef,
      businessId,
      expectedPurpose: PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
      expectedAmountMinor: charge.amountMinor,
      expectedCurrency: charge.currency,
      notSuccessfulMessage: "Renewal charge not successful.",
      purposeMismatchMessage: "Transaction is not a subscription renewal.",
    });
    if (verified.ok) {
      const applied = await applyPaystackRenewalSuccess(db, {
        businessId,
        reference: claimedRef,
        amountMinor: verified.amountMinor,
        currency: verified.currency,
        planCode: plan,
        cycle,
        expiredPeriodEndIso: periodEndIso,
        previousPlan: plan,
      });
      if (!applied.ok) {
        return { outcome: "error", error: applied.error };
      }
      return { outcome: "renewed" };
    }
    if (mode === "initial") {
      await markRenewalGraceStarted(
        db,
        businessId,
        claimedRef,
        periodEndIso,
        verified.error,
        now,
      );
      return { outcome: "grace_started" };
    }
    // Retry: prior attempt did not succeed — charge again below with same reference.
  } else if (mode === "retry") {
    return { outcome: "skipped", reason: "retry_missing_claim" };
  } else {
    const nowIso = now.toISOString();
    const claimPayload = {
      renewal_charge_reference: reference,
      renewal_charge_for_period_end: periodEndIso,
      updated_at: nowIso,
    };

    let { data: claimed, error: claimErr } = await db
      .from("subscriptions")
      .update(claimPayload)
      .eq("business_id", businessId)
      .eq("status", "active")
      .eq("recurring_billing_enabled", true)
      .not("paystack_authorization_code", "is", null)
      .not("trial_card_captured_at", "is", null)
      .lte("current_period_end", nowIso)
      .is("renewal_charge_for_period_end", null)
      .select("id")
      .maybeSingle();

    if (claimErr) {
      return { outcome: "error", error: claimErr.message };
    }

    if (!claimed) {
      const { data: existing, error: readErr } = await db
        .from("subscriptions")
        .select("renewal_charge_for_period_end, renewal_charge_reference")
        .eq("business_id", businessId)
        .maybeSingle();

      if (readErr) {
        return { outcome: "error", error: readErr.message };
      }

      const existingPeriod = existing?.renewal_charge_for_period_end?.trim() ?? "";
      const existingRef = existing?.renewal_charge_reference?.trim() ?? "";

      if (existingPeriod === periodEndIso && existingRef) {
        chargeReference = existingRef;
      } else {
        const racedPaid = await completeRenewalIfAlreadyPaid(
          db,
          businessId,
          reference,
          plan,
          cycle,
          periodEndIso,
          charge,
        );
        if (racedPaid) {
          return racedPaid;
        }
        return { outcome: "claim_lost" };
      }
    } else {
      chargeReference = reference;
    }
  }

  const authCode = row.paystack_authorization_code!.trim();
  const email = row.paystack_customer_email!.trim();

  let chargeResult: Awaited<ReturnType<typeof chargePaystackAuthorization>>;
  try {
    chargeResult = await chargePaystackAuthorization({
      authorizationCode: authCode,
      email,
      amountMinor: charge.amountMinor,
      currency: charge.currency,
      reference: chargeReference,
      businessId,
      planCode: plan,
      billingCycle: cycle,
      purpose: PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "charge_authorization error";
    if (mode === "retry") {
      await markRenewalRetryFailed(
        db,
        businessId,
        chargeReference,
        periodEndIso,
        msg,
        row.renewal_failed_at ?? now.toISOString(),
        row.renewal_retry_count ?? 1,
        now,
      );
    } else {
      await markRenewalGraceStarted(db, businessId, chargeReference, periodEndIso, msg, now);
    }
    return { outcome: "grace_started" };
  }

  if (!chargeResult.ok) {
    if (mode === "retry") {
      await markRenewalRetryFailed(
        db,
        businessId,
        chargeResult.reference,
        periodEndIso,
        chargeResult.error,
        row.renewal_failed_at ?? now.toISOString(),
        row.renewal_retry_count ?? 1,
        now,
      );
    } else {
      await markRenewalGraceStarted(
        db,
        businessId,
        chargeResult.reference,
        periodEndIso,
        chargeResult.error,
        now,
      );
    }
    return { outcome: "grace_started" };
  }

  const verified = await verifyPaystackAuthorizationCharge({
    reference: chargeResult.reference,
    businessId,
    expectedPurpose: PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
    expectedAmountMinor: charge.amountMinor,
    expectedCurrency: charge.currency,
    notSuccessfulMessage: "Renewal charge not successful.",
    purposeMismatchMessage: "Transaction is not a subscription renewal.",
  });

  if (!verified.ok) {
    if (mode === "retry") {
      await markRenewalRetryFailed(
        db,
        businessId,
        chargeResult.reference,
        periodEndIso,
        verified.error,
        row.renewal_failed_at ?? now.toISOString(),
        row.renewal_retry_count ?? 1,
        now,
      );
    } else {
      await markRenewalGraceStarted(
        db,
        businessId,
        chargeResult.reference,
        periodEndIso,
        verified.error,
        now,
      );
    }
    return { outcome: "grace_started" };
  }

  const applied = await applyPaystackRenewalSuccess(db, {
    businessId,
    reference: chargeResult.reference,
    amountMinor: verified.amountMinor,
    currency: verified.currency,
    planCode: plan,
    cycle,
    expiredPeriodEndIso: periodEndIso,
    previousPlan: plan,
  });

  if (!applied.ok) {
    return { outcome: "error", error: applied.error };
  }

  console.info("[paystackSubscriptionRenewal] renewed", {
    businessId,
    reference: chargeResult.reference,
    periodEndIso,
    amountMinor: verified.amountMinor,
    currency: verified.currency,
  });

  return { outcome: "renewed" };
}
