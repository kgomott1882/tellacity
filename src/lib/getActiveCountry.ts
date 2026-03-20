// src/lib/getActiveCountry.ts
const STORAGE_KEY = "tellacity_country";
const ALLOWED_COUNTRIES = ["US", "ZA", "GB", "AU", "CA", "NZ", "IE"] as const;

function normalizeCountry(code: string | null | undefined): string | null {
  const upper = String(code ?? "").trim().toUpperCase();
  if (!upper) return null;
  return ALLOWED_COUNTRIES.includes(upper as (typeof ALLOWED_COUNTRIES)[number])
    ? upper
    : null;
}

export function getActiveCountry(): string | null {
  if (typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get("country");
    const normalizedFromUrl = normalizeCountry(fromUrl);
    if (normalizedFromUrl) return normalizedFromUrl;
    return normalizeCountry(window.localStorage.getItem(STORAGE_KEY));
  }
  return null;
}

export function setActiveCountry(code: string | null): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeCountry(code);
  if (normalized) {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event("tellacity-country-change"));
}
