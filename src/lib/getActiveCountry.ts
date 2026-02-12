// src/lib/getActiveCountry.ts
const STORAGE_KEY = "tellacity_country";

export function getActiveCountry(): string | null {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return null;
}

export function setActiveCountry(code: string | null): void {
  if (typeof window === "undefined") return;
  if (code) {
    window.localStorage.setItem(STORAGE_KEY, code);
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  window.dispatchEvent(new Event("tellacity-country-change"));
}
