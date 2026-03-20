export function getStoredCountry(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tellacity_country");
}

export function setStoredCountry(country: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tellacity_country", country);
}
