export const DEFAULT_COUNTRY = "US";
export const COUNTRY_CHANGE_EVENT = "tellacity-country-change";
const ALLOWED_COUNTRIES = ["US", "ZA", "GB", "AU", "CA", "NZ", "IE"] as const;

export function normalizeCountryCode(code: string | null | undefined): string {
  const upper = String(code ?? "").trim().toUpperCase();
  if (!upper) return DEFAULT_COUNTRY;
  const normalized = upper === "UK" ? "GB" : upper;
  return ALLOWED_COUNTRIES.includes(normalized as (typeof ALLOWED_COUNTRIES)[number])
    ? normalized
    : DEFAULT_COUNTRY;
}

export function getStoredCountry(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("tellacity_country");
  return raw ? normalizeCountryCode(raw) : null;
}

export function setStoredCountry(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCountryCode(code);
  localStorage.setItem("tellacity_country", normalized);
  window.dispatchEvent(
    new CustomEvent(COUNTRY_CHANGE_EVENT, { detail: { country: normalized } })
  );
}
