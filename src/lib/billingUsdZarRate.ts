/**
 * USD→ZAR for converting Tellacity’s **USD list prices** to Paystack ZAR amounts (South Africa).
 *
 * Set `BILLING_USD_ZAR_RATE` (e.g. `18.75`) to pin the rate and skip the network (recommended for predictable charges).
 * Otherwise we fetch from Frankfurter (ECB) and cache in memory for one hour.
 */

let memoryCache: { rate: number; at: number } | null = null;
const TTL_MS = 60 * 60 * 1000;

/** Used only when env + network + cache are unavailable. */
const FALLBACK_USD_ZAR = 18.5;

export async function getUsdToZarRate(): Promise<number> {
  const envRaw = process.env.BILLING_USD_ZAR_RATE?.trim();
  if (envRaw) {
    const n = Number(envRaw);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const now = Date.now();
  if (memoryCache && now - memoryCache.at < TTL_MS) {
    return memoryCache.rate;
  }

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=ZAR", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { rates?: { ZAR?: number } };
    const rate = json?.rates?.ZAR;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid ZAR rate in response");
    }
    memoryCache = { rate, at: now };
    return rate;
  } catch {
    if (memoryCache) return memoryCache.rate;
    return FALLBACK_USD_ZAR;
  }
}
