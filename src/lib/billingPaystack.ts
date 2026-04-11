import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { getAnnualTotalDueUsd, PAID_PLAN_USD } from "@/lib/billingPlanConfirm";
import { getUsdToZarRate } from "@/lib/billingUsdZarRate";

/**
 * Paystack `amount` must be in the smallest currency unit for the charged currency
 * (e.g. cents for USD/ZAR with 2 decimal places).
 *
 * {@link PAID_PLAN_USD} is always **USD** list price. When {@link paystackCurrency} is `ZAR`
 * (typical South Africa Paystack), we convert USD→ZAR for the charge so customers see USD on Tellacity
 * and the Rand total Paystack shows matches that conversion (see checkout copy).
 */
export function planListPriceUsdMajor(
  plan: PaidPlanKey,
  cycle: "monthly" | "annual"
): number {
  const row = PAID_PLAN_USD[plan];
  return cycle === "monthly" ? row.monthly : getAnnualTotalDueUsd(plan);
}

export type PaystackChargeResolution = {
  currency: string;
  amountMinor: number;
  listUsdMajor: number;
  /** ZAR major units when charging ZAR; otherwise null. */
  settleMajor: number | null;
  /** Effective USD→ZAR when charging ZAR; otherwise null. */
  fxUsdZar: number | null;
};

export async function resolvePaystackChargeDetails(
  plan: PaidPlanKey,
  cycle: "monthly" | "annual"
): Promise<PaystackChargeResolution> {
  const currency = paystackCurrency();
  const listUsdMajor = planListPriceUsdMajor(plan, cycle);

  if (currency === "ZAR") {
    const fx = await getUsdToZarRate();
    const zarMajor = Math.round(listUsdMajor * fx * 100) / 100;
    const amountMinor = Math.round(zarMajor * 100);
    return {
      currency: "ZAR",
      amountMinor,
      listUsdMajor,
      settleMajor: zarMajor,
      fxUsdZar: fx,
    };
  }

  const amountMinor = Math.round(listUsdMajor * 100);
  return {
    currency,
    amountMinor,
    listUsdMajor,
    settleMajor: null,
    fxUsdZar: null,
  };
}

/**
 * Server / API routes: prefers secret env, then public, then ZAR.
 * Must match your Paystack dashboard currency.
 */
export function paystackCurrency(): string {
  const c =
    process.env.PAYSTACK_CURRENCY?.trim() ||
    process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY?.trim() ||
    "ZAR";
  return c.length >= 3 ? c.toUpperCase().slice(0, 3) : "ZAR";
}

/**
 * Browser only: `PAYSTACK_*` is not inlined by Next.js; use `NEXT_PUBLIC_PAYSTACK_CURRENCY` or ZAR.
 */
export function paystackCurrencyPublic(): string {
  const c = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY?.trim() || "ZAR";
  return c.length >= 3 ? c.toUpperCase().slice(0, 3) : "ZAR";
}

export function paystackSecretKey(): string | null {
  const k = process.env.PAYSTACK_SECRET_KEY?.trim();
  return k || null;
}

/** True if the value looks like a Paystack public key (avoids opaque `invalid_key` from the popup API). */
export function isPaystackPublicKeyFormat(key: string | undefined | null): boolean {
  const k = typeof key === "string" ? key.trim() : "";
  return /^pk_(test|live)_[A-Za-z0-9_-]+$/.test(k);
}
