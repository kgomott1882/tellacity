import type { SupabaseClient } from "@supabase/supabase-js";
import { getValidatedPaystackSecret, paystackCurrency } from "@/lib/billingPaystack";
import { provisionReverseTrialIfEligible } from "@/lib/provisionReverseTrial";

/** Metadata purpose — distinguishes trial tokenization from paid Grow checkout. */
export const PAYSTACK_TRIAL_CARD_METADATA_PURPOSE = "trial_card_capture" as const;

export type PaystackTrialCardAuthorization = {
  authorizationCode: string;
  customerCode: string | null;
  customerEmail: string;
  reusable: boolean;
  reference: string;
  amountMinor: number;
  currency: string;
};

type PaystackVerifyPayload = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    metadata?: Record<string, unknown>;
    customer?: {
      email?: string | null;
      customer_code?: string | null;
    };
    authorization?: {
      authorization_code?: string | null;
      reusable?: boolean;
    };
  };
};

/**
 * Paystack only returns a reusable authorization_code after a successful card
 * transaction (no zero-amount tokenization for cards). Official minimums:
 * ZAR 1.00, USD 2.00, NGN 50.00 — see Paystack recurring-charges docs.
 * We charge the minimum verify amount, then refund immediately after saving the auth.
 */
export function trialCardVerifyAmountMinor(currency: string): number {
  const c = currency.trim().toUpperCase();
  if (c === "ZAR") return 100;
  if (c === "USD") return 200;
  if (c === "NGN") return 5000;
  if (c === "GHS") return 10;
  if (c === "KES") return 300;
  return 100;
}

export function buildTrialCardCaptureReference(businessId: string): string {
  return `tellacity_trial_card_${businessId.slice(0, 8)}_${Date.now()}`;
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyPayload> {
  const secret = getValidatedPaystackSecret();
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    },
  );
  const json = (await res.json()) as PaystackVerifyPayload;
  // TEMP DEBUG (card-on-trial): remove after diagnosing extract failures.
  console.log("[paystackTrialCardCapture][DEBUG] verify HTTP", {
    reference,
    httpOk: res.ok,
    httpStatus: res.status,
    topLevelStatus: json.status,
    topLevelMessage: json.message,
    dataStatus: json.data?.status,
    dataAmount: json.data?.amount,
    dataCurrency: json.data?.currency,
    metadata: json.data?.metadata,
    metadataType: typeof json.data?.metadata,
    authorization: json.data?.authorization,
    customer: json.data?.customer,
  });
  return json;
}

function normalizeCurrency(code: unknown): string {
  const s = typeof code === "string" ? code.trim().toUpperCase() : "";
  return s.length >= 3 ? s.slice(0, 3) : "";
}

export function extractTrialCardAuthorization(
  payload: PaystackVerifyPayload,
  expectedBusinessId: string,
): PaystackTrialCardAuthorization | { error: string } {
  if (payload.data?.status !== "success") {
    return { error: "Payment not successful." };
  }

  const meta = payload.data.metadata ?? {};
  const purpose =
    typeof meta.purpose === "string" ? meta.purpose.trim() : "";
  const metaBiz =
    typeof meta.business_id === "string" ? meta.business_id.trim() : "";

  if (purpose !== PAYSTACK_TRIAL_CARD_METADATA_PURPOSE) {
    return { error: "Transaction is not a trial card capture." };
  }
  if (!metaBiz || metaBiz !== expectedBusinessId) {
    return { error: "Transaction does not match this workspace." };
  }

  const currency = normalizeCurrency(payload.data.currency);
  const expectedMinor = trialCardVerifyAmountMinor(currency);
  const paidMinor =
    typeof payload.data.amount === "number" && Number.isFinite(payload.data.amount)
      ? Math.round(payload.data.amount)
      : NaN;

  if (!Number.isFinite(paidMinor) || paidMinor !== expectedMinor) {
    return { error: "Trial card verify amount mismatch." };
  }

  const auth = payload.data.authorization;
  const authorizationCode = auth?.authorization_code?.trim() ?? "";
  if (!authorizationCode) {
    return { error: "No card authorization returned from Paystack." };
  }
  if (auth?.reusable !== true) {
    return {
      error: "This card can't be saved for future billing. Try another card.",
    };
  }

  const customerEmail = payload.data.customer?.email?.trim() ?? "";
  if (!customerEmail.includes("@")) {
    return { error: "Paystack did not return a customer email for this authorization." };
  }

  const reference =
    typeof payload.data.reference === "string" ? payload.data.reference.trim() : "";
  if (!reference) {
    return { error: "Missing transaction reference." };
  }

  const customerCode = payload.data.customer?.customer_code?.trim() || null;

  return {
    authorizationCode,
    customerCode,
    customerEmail,
    reusable: true,
    reference,
    amountMinor: paidMinor,
    currency,
  };
}

/** Best-effort refund of the tokenization verify charge (Paystack standard practice). */
export async function refundPaystackTrialVerifyCharge(
  reference: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const secret = getValidatedPaystackSecret();
    const res = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction: reference }),
    });
    const json = (await res.json()) as { status?: boolean; message?: string };
    if (!res.ok || json.status !== true) {
      const msg =
        typeof json.message === "string" && json.message.trim()
          ? json.message.trim()
          : "Refund request failed.";
      console.warn("[paystackTrialCardCapture] refund:", reference, msg);
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Refund request failed.";
    console.warn("[paystackTrialCardCapture] refund unhandled:", reference, msg);
    return { ok: false, error: msg };
  }
}

function isTrialCardVerifyChargeSucceeded(
  payload: PaystackVerifyPayload,
  businessId: string,
): boolean {
  if (payload.data?.status !== "success") return false;

  const meta = payload.data.metadata ?? {};
  const purpose = typeof meta.purpose === "string" ? meta.purpose.trim() : "";
  const metaBiz = typeof meta.business_id === "string" ? meta.business_id.trim() : "";
  return purpose === PAYSTACK_TRIAL_CARD_METADATA_PURPOSE && metaBiz === businessId;
}

function isPaystackTransactionFullyRefunded(payload: PaystackVerifyPayload): boolean {
  const data = payload.data;
  if (!data) return false;

  if ((data as { refunded?: boolean }).refunded === true) return true;

  const amount =
    typeof data.amount === "number" && Number.isFinite(data.amount) ? data.amount : 0;
  const amountRefunded =
    typeof (data as { amount_refunded?: number }).amount_refunded === "number" &&
    Number.isFinite((data as { amount_refunded: number }).amount_refunded)
      ? (data as { amount_refunded: number }).amount_refunded
      : 0;

  return amount > 0 && amountRefunded >= amount;
}

async function persistTrialVerifyRefundFailure(
  db: SupabaseClient,
  businessId: string,
  errorMessage: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error: refundLogErr } = await db
    .from("subscriptions")
    .update({
      trial_card_verify_refund_failed_at: now,
      trial_card_verify_refund_error: errorMessage.slice(0, 2000),
      updated_at: now,
    })
    .eq("business_id", businessId);

  if (refundLogErr) {
    console.error("[paystackTrialCardCapture] refund failure log:", refundLogErr.message);
  }
}

/**
 * Refund the R1/ZAR verify charge when capture fails after Paystack succeeded.
 * Skips when already fully refunded (success path or prior attempt).
 */
export async function ensureTrialVerifyChargeRefunded(
  db: SupabaseClient,
  businessId: string,
  reference: string,
  verifyPayload?: PaystackVerifyPayload,
): Promise<{ ok: true; refunded: boolean } | { ok: false; error: string }> {
  const payload = verifyPayload ?? (await verifyPaystackTransaction(reference));

  if (!isTrialCardVerifyChargeSucceeded(payload, businessId)) {
    return { ok: true, refunded: false };
  }

  if (isPaystackTransactionFullyRefunded(payload)) {
    return { ok: true, refunded: false };
  }

  const refund = await refundPaystackTrialVerifyCharge(reference);
  if (!refund.ok) {
    await persistTrialVerifyRefundFailure(db, businessId, refund.error);
    console.error("[paystackTrialCardCapture] verify refund failed", {
      businessId,
      reference,
      error: refund.error,
    });
    return { ok: false, error: refund.error };
  }

  return { ok: true, refunded: true };
}

export async function persistTrialCardOnSubscription(
  db: SupabaseClient,
  businessId: string,
  auth: PaystackTrialCardAuthorization,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { error } = await db
    .from("subscriptions")
    .update({
      paystack_authorization_code: auth.authorizationCode,
      paystack_customer_code: auth.customerCode,
      paystack_customer_email: auth.customerEmail,
      trial_card_captured_at: now,
      updated_at: now,
    })
    .eq("business_id", businessId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export type CompleteTrialCardCaptureResult =
  | { ok: true; plan: "grow"; refunded: boolean }
  | { ok: false; error: string; status: number };

/**
 * Verify Paystack trial card txn → provision Grow trial → persist authorization → refund verify charge.
 * Trial provisions only after a reusable authorization is confirmed.
 */
export async function completeTrialCardCaptureAndProvision(
  db: SupabaseClient,
  businessId: string,
  reference: string,
): Promise<CompleteTrialCardCaptureResult> {
  const verifyPayload = await verifyPaystackTransaction(reference);
  const chargeSucceeded = isTrialCardVerifyChargeSucceeded(verifyPayload, businessId);

  const failAfterCharge = async (
    error: string,
    status: number,
  ): Promise<CompleteTrialCardCaptureResult> => {
    if (chargeSucceeded) {
      await ensureTrialVerifyChargeRefunded(db, businessId, reference, verifyPayload);
    }
    return { ok: false, error, status };
  };

  const extracted = extractTrialCardAuthorization(verifyPayload, businessId);
  if ("error" in extracted) {
    // TEMP DEBUG (card-on-trial): remove after diagnosing extract failures.
    console.log("[paystackTrialCardCapture][DEBUG] extract rejected", {
      reference,
      businessId,
      error: extracted.error,
      dataStatus: verifyPayload.data?.status,
      purpose:
        typeof verifyPayload.data?.metadata === "object" &&
        verifyPayload.data?.metadata !== null &&
        !Array.isArray(verifyPayload.data.metadata)
          ? (verifyPayload.data.metadata as Record<string, unknown>).purpose
          : verifyPayload.data?.metadata,
      business_id_meta:
        typeof verifyPayload.data?.metadata === "object" &&
        verifyPayload.data?.metadata !== null &&
        !Array.isArray(verifyPayload.data.metadata)
          ? (verifyPayload.data.metadata as Record<string, unknown>).business_id
          : null,
      amount: verifyPayload.data?.amount,
      currency: verifyPayload.data?.currency,
      expectedMinor: verifyPayload.data?.currency
        ? trialCardVerifyAmountMinor(String(verifyPayload.data.currency))
        : null,
      authorization_code: verifyPayload.data?.authorization?.authorization_code,
      reusable: verifyPayload.data?.authorization?.reusable,
      reusableType: typeof verifyPayload.data?.authorization?.reusable,
      customer_email: verifyPayload.data?.customer?.email,
    });
    return failAfterCharge(extracted.error, 400);
  }

  const provision = await provisionReverseTrialIfEligible(businessId, db);
  if (!provision.provisioned) {
    if (provision.reason === "not_free" || provision.reason === "subscription_exists") {
      return failAfterCharge("not_eligible", 409);
    }
    console.error("[paystackTrialCardCapture] provision failed:", provision.reason);
    return failAfterCharge("provision_failed", 500);
  }

  const saved = await persistTrialCardOnSubscription(db, businessId, extracted);
  if (!saved.ok) {
    console.error("[paystackTrialCardCapture] persist auth:", saved.error);
    return failAfterCharge("Could not save card authorization.", 500);
  }

  const refund = await ensureTrialVerifyChargeRefunded(db, businessId, reference, verifyPayload);

  console.info("[paystackTrialCardCapture] trial card saved", {
    businessId,
    reference,
    currency: extracted.currency,
    amountMinor: extracted.amountMinor,
    refunded: refund.ok && refund.refunded,
  });

  return { ok: true, plan: "grow", refunded: refund.ok && refund.refunded };
}

/** Currency + verify amount for initialize (reuses account Paystack currency). */
export function resolveTrialCardVerifyCharge(): {
  currency: string;
  amountMinor: number;
} {
  const currency = paystackCurrency();
  return { currency, amountMinor: trialCardVerifyAmountMinor(currency) };
}
