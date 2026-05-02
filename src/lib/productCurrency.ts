/**
 * Normalize user-supplied currency to a valid ISO 4217 code for Intl, default USD.
 */
export function sanitizeProductCurrencyCode(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if (!/^[A-Z]{3}$/.test(s)) return "USD";
  try {
    Intl.NumberFormat("en-US", { style: "currency", currency: s }).format(0);
    return s;
  } catch {
    return "USD";
  }
}

/** Locale for currency strings in SSR + client (avoids hydration mismatches from `undefined`). */
const PRODUCT_PRICE_LOCALE = "en-US" as const;

/**
 * Format a stored numeric amount with the given currency (public profile, dashboards).
 * Uses a fixed locale so server-rendered HTML matches the browser on hydrate.
 */
export function formatProductPrice(
  amount: number | null | undefined,
  currencyCode: string | null | undefined
): string | null {
  if (amount == null || !Number.isFinite(amount)) return null;
  const cur = sanitizeProductCurrencyCode(currencyCode ?? "USD");
  try {
    return new Intl.NumberFormat(PRODUCT_PRICE_LOCALE, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(PRODUCT_PRICE_LOCALE, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/** Popular currencies for dashboard dropdowns (ISO 4217). */
export const PRODUCT_CURRENCY_OPTIONS: { code: string; label: string }[] = [
  { code: "USD", label: "USD — US dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British pound" },
  { code: "ZAR", label: "ZAR — South African rand" },
  { code: "AUD", label: "AUD — Australian dollar" },
  { code: "CAD", label: "CAD — Canadian dollar" },
  { code: "CHF", label: "CHF — Swiss franc" },
  { code: "JPY", label: "JPY — Japanese yen" },
  { code: "CNY", label: "CNY — Chinese yuan" },
  { code: "INR", label: "INR — Indian rupee" },
  { code: "NZD", label: "NZD — New Zealand dollar" },
  { code: "SEK", label: "SEK — Swedish krona" },
  { code: "NOK", label: "NOK — Norwegian krone" },
  { code: "DKK", label: "DKK — Danish krone" },
  { code: "PLN", label: "PLN — Polish złoty" },
  { code: "MXN", label: "MXN — Mexican peso" },
  { code: "BRL", label: "BRL — Brazilian real" },
  { code: "AED", label: "AED — UAE dirham" },
  { code: "SGD", label: "SGD — Singapore dollar" },
  { code: "HKD", label: "HKD — Hong Kong dollar" },
  { code: "KRW", label: "KRW — South Korean won" },
  { code: "TRY", label: "TRY — Turkish lira" },
  { code: "THB", label: "THB — Thai baht" },
  { code: "PHP", label: "PHP — Philippine peso" },
  { code: "IDR", label: "IDR — Indonesian rupiah" },
  { code: "MYR", label: "MYR — Malaysian ringgit" },
  { code: "NGN", label: "NGN — Nigerian naira" },
  { code: "EGP", label: "EGP — Egyptian pound" },
  { code: "KES", label: "KES — Kenyan shilling" },
];

/** Codes included in {@link PRODUCT_CURRENCY_OPTIONS} (for select vs custom input). */
export const PRODUCT_CURRENCY_OPTION_CODES = new Set(
  PRODUCT_CURRENCY_OPTIONS.map((o) => o.code)
);
