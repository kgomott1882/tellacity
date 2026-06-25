import type { PaystackAuthorizationChargePurpose } from "@/lib/paystackAuthorizationCharge";
import {
  PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
  PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
} from "@/lib/paystackRenewalConstants";

/** Returned by {@link chargePaystackAuthorization} when simulate-decline is active. */
export const PAYSTACK_SIMULATED_DECLINE_ERROR = "Simulated decline (dev test)";

function parseTruthyEnv(raw: string | undefined): boolean {
  const v = raw?.trim().toLowerCase() ?? "";
  return v === "true" || v === "1" || v === "yes";
}

function normalizePaystackKey(raw: string | undefined): string {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

/**
 * Dev-only simulate decline. NEVER active in production or with sk_live_.
 *
 * Requires ALL of:
 * - FEATURE_PAYSTACK_SIMULATE_CHARGE_DECLINE=true
 * - NODE_ENV !== "production"
 * - PAYSTACK_SECRET_KEY starts with sk_test_
 */
export function isPaystackSimulateChargeDeclineActive(): boolean {
  if (!parseTruthyEnv(process.env.FEATURE_PAYSTACK_SIMULATE_CHARGE_DECLINE)) {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const key = normalizePaystackKey(process.env.PAYSTACK_SECRET_KEY);
  if (!key.startsWith("sk_test_")) {
    return false;
  }

  return true;
}

const SIMULATABLE_CHARGE_PURPOSES = new Set<PaystackAuthorizationChargePurpose>([
  PAYSTACK_SUBSCRIPTION_RENEWAL_METADATA_PURPOSE,
  PAYSTACK_TRIAL_END_CHARGE_METADATA_PURPOSE,
]);

/** Authorization charges that may be simulated when {@link isPaystackSimulateChargeDeclineActive}. */
export function shouldSimulatePaystackAuthorizationChargeDecline(
  purpose: PaystackAuthorizationChargePurpose,
): boolean {
  return SIMULATABLE_CHARGE_PURPOSES.has(purpose);
}
