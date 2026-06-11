import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { planListPriceUsdMajor } from "@/lib/billingPaystack";

export const PAYPAL_CURRENCY = "USD" as const;

export function getPaypalMode(): "sandbox" | "live" {
  const raw = (process.env.PAYPAL_MODE ?? "sandbox").trim().toLowerCase();
  return raw === "live" ? "live" : "sandbox";
}

export function getPaypalApiBase(): string {
  return getPaypalMode() === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getValidatedPaypalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) {
    throw new Error(
      "PayPal API keys are missing on the server (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET)."
    );
  }
  return { clientId, clientSecret };
}

let cachedToken: { value: string; expiresAtMs: number } | null = null;

export async function getPaypalAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 30_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = getValidatedPaypalCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${getPaypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };

  if (!res.ok || !json.access_token) {
    const err = typeof json.error === "string" ? json.error : "PayPal auth failed";
    if (err === "invalid_client") {
      throw new Error(
        "PayPal rejected the API credentials. Check PAYPAL_MODE matches sandbox vs live keys."
      );
    }
    throw new Error(err);
  }

  const ttlSec = typeof json.expires_in === "number" ? json.expires_in : 3600;
  cachedToken = {
    value: json.access_token,
    expiresAtMs: now + ttlSec * 1000,
  };
  return json.access_token;
}

export type PaypalChargeResolution = {
  currency: typeof PAYPAL_CURRENCY;
  listUsdMajor: number;
  listUsdMinor: number;
};

export function resolvePaypalChargeDetails(
  plan: PaidPlanKey,
  cycle: "monthly" | "annual"
): PaypalChargeResolution {
  const listUsdMajor = planListPriceUsdMajor(plan, cycle);
  const listUsdMinor = Math.max(0, Math.round(listUsdMajor * 100));
  return {
    currency: PAYPAL_CURRENCY,
    listUsdMajor,
    listUsdMinor,
  };
}

/** PayPal `amount.value` string with 2 decimal places. */
export function usdMinorToPaypalValue(usdMinor: number): string {
  const major = Math.max(0, usdMinor) / 100;
  return major.toFixed(2);
}

export function parsePaypalUsdValue(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const n = Number.parseFloat(value.trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export type PaypalOrderCustomMeta = {
  businessId: string;
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  creditReference: string;
  creditAppliedUsdMinor: number;
  listUsdMinor: number;
};

export function encodePaypalCustomId(meta: PaypalOrderCustomMeta): string {
  return [
    "tc1",
    meta.businessId,
    meta.plan,
    meta.cycle,
    meta.creditReference,
    String(meta.creditAppliedUsdMinor),
    String(meta.listUsdMinor),
  ].join("|");
}

export function decodePaypalCustomId(raw: unknown): PaypalOrderCustomMeta | null {
  if (typeof raw !== "string" || !raw.startsWith("tc1|")) return null;
  const parts = raw.split("|");
  if (parts.length !== 7) return null;
  const [, businessId, planRaw, cycleRaw, creditReference, creditUsdRaw, listUsdRaw] = parts;
  const plan = planRaw?.trim().toLowerCase();
  if (plan !== "grow" && plan !== "premium" && plan !== "elite") return null;
  const cycle = cycleRaw === "annual" ? "annual" : cycleRaw === "monthly" ? "monthly" : null;
  if (!cycle || !businessId || !creditReference) return null;
  const creditAppliedUsdMinor = Number.parseInt(creditUsdRaw ?? "0", 10);
  const listUsdMinor = Number.parseInt(listUsdRaw ?? "0", 10);
  if (!Number.isFinite(creditAppliedUsdMinor) || !Number.isFinite(listUsdMinor)) return null;
  return {
    businessId,
    plan,
    cycle,
    creditReference,
    creditAppliedUsdMinor: Math.max(0, creditAppliedUsdMinor),
    listUsdMinor: Math.max(0, listUsdMinor),
  };
}
