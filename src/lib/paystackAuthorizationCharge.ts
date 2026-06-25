import { getValidatedPaystackSecret } from "@/lib/billingPaystack";
import {
  isPaystackSimulateChargeDeclineActive,
  PAYSTACK_SIMULATED_DECLINE_ERROR,
  shouldSimulatePaystackAuthorizationChargeDecline,
} from "@/lib/paystackSimulateChargeDecline";
import { verifyPaystackTransaction } from "@/lib/paystackTrialCardCapture";
import {
  PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
  PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
} from "@/lib/paystackRenewalConstants";

export type PaystackAuthorizationChargePurpose =
  | typeof PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE
  | typeof PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE;

export {
  PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
  PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
};

export type ChargePaystackAuthorizationInput = {
  authorizationCode: string;
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  businessId: string;
  planCode: string;
  billingCycle: "monthly" | "annual";
  purpose: PaystackAuthorizationChargePurpose;
};

type ChargeAuthorizationResponse = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    paused?: boolean;
    authorization_url?: string;
  };
};

export async function chargePaystackAuthorization(
  input: ChargePaystackAuthorizationInput,
): Promise<
  | { ok: true; reference: string }
  | { ok: false; error: string; reference: string; paused?: boolean }
> {
  if (
    isPaystackSimulateChargeDeclineActive() &&
    shouldSimulatePaystackAuthorizationChargeDecline(input.purpose)
  ) {
    return {
      ok: false,
      error: PAYSTACK_SIMULATED_DECLINE_ERROR,
      reference: input.reference,
    };
  }

  const secret = getValidatedPaystackSecret();

  const res = await fetch("https://api.paystack.co/transaction/charge_authorization", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authorization_code: input.authorizationCode,
      email: input.email,
      amount: input.amountMinor,
      currency: input.currency,
      reference: input.reference,
      metadata: {
        business_id: input.businessId,
        plan_code: input.planCode,
        billing_cycle: input.billingCycle,
        purpose: input.purpose,
      },
    }),
    cache: "no-store",
  });

  const json = (await res.json()) as ChargeAuthorizationResponse;
  const reference =
    (typeof json.data?.reference === "string" ? json.data.reference.trim() : "") ||
    input.reference;

  if (!res.ok || json.status !== true) {
    const msg =
      typeof json.message === "string" && json.message.trim()
        ? json.message.trim()
        : "Paystack charge_authorization failed.";
    return { ok: false, error: msg, reference };
  }

  if (json.data?.paused === true) {
    return {
      ok: false,
      error: "Card requires additional authorization (2FA).",
      reference,
      paused: true,
    };
  }

  const chargeStatus = String(json.data?.status ?? "").toLowerCase();
  if (chargeStatus !== "success") {
    return {
      ok: false,
      error: `Charge status: ${chargeStatus || "unknown"}.`,
      reference,
    };
  }

  return { ok: true, reference };
}

export type VerifyPaystackAuthorizationChargeInput = {
  reference: string;
  businessId: string;
  expectedPurpose: PaystackAuthorizationChargePurpose;
  expectedAmountMinor: number;
  expectedCurrency: string;
  notSuccessfulMessage?: string;
  purposeMismatchMessage?: string;
};

export async function verifyPaystackAuthorizationCharge(
  input: VerifyPaystackAuthorizationChargeInput,
): Promise<{ ok: true; amountMinor: number; currency: string } | { ok: false; error: string }> {
  const payload = await verifyPaystackTransaction(input.reference);
  if (payload.data?.status !== "success") {
    return {
      ok: false,
      error: input.notSuccessfulMessage ?? "Authorization charge not successful.",
    };
  }

  const meta = payload.data.metadata ?? {};
  const purpose = typeof meta.purpose === "string" ? meta.purpose.trim() : "";
  const metaBiz =
    typeof meta.business_id === "string" ? meta.business_id.trim() : "";

  if (purpose !== input.expectedPurpose) {
    return {
      ok: false,
      error: input.purposeMismatchMessage ?? "Transaction purpose mismatch.",
    };
  }
  if (metaBiz !== input.businessId) {
    return { ok: false, error: "Transaction does not match workspace." };
  }

  const paidMinor =
    typeof payload.data.amount === "number" && Number.isFinite(payload.data.amount)
      ? Math.round(payload.data.amount)
      : NaN;
  const paidCurrency = String(payload.data.currency ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 3);

  if (
    !Number.isFinite(paidMinor) ||
    paidMinor !== input.expectedAmountMinor ||
    paidCurrency !== input.expectedCurrency
  ) {
    return { ok: false, error: "Authorization charge amount mismatch." };
  }

  return { ok: true, amountMinor: paidMinor, currency: paidCurrency };
}
