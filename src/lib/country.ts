export const DEFAULT_COUNTRY = "US";
export const COUNTRY_CHANGE_EVENT = "tellacity-country-change";
/** Mirrors `localStorage` key; used by middleware for SSR-aligned country. */
export const COUNTRY_COOKIE_NAME = "tellacity_country";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const ALLOWED_COUNTRIES = ["US", "ZA", "GB", "AU", "CA", "NZ", "IE"] as const;

import { hasFunctionalConsent } from "@/lib/cookieConsent";

function writeCountryCookieClient(normalized: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COUNTRY_COOKIE_NAME}=${encodeURIComponent(normalized)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

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
  const raw = localStorage.getItem(COUNTRY_COOKIE_NAME);
  return raw ? normalizeCountryCode(raw) : null;
}

export function clearStoredCountry() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(COUNTRY_COOKIE_NAME);
  document.cookie = `${COUNTRY_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(
    new CustomEvent(COUNTRY_CHANGE_EVENT, { detail: { country: null } })
  );
}

export function setStoredCountry(code: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCountryCode(code);
  if (!hasFunctionalConsent()) return;
  localStorage.setItem(COUNTRY_COOKIE_NAME, normalized);
  writeCountryCookieClient(normalized);
  window.dispatchEvent(
    new CustomEvent(COUNTRY_CHANGE_EVENT, { detail: { country: normalized } })
  );
}
