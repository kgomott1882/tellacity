export const SUPPORTED_COUNTRY_CODES = [
  "US",
  "ZA",
  "UK",
  "AU",
  "CA",
  "NZ",
  "IE",
] as const;

export type SupportedCountryCode = (typeof SUPPORTED_COUNTRY_CODES)[number];

export const COUNTRY_LABELS: Record<SupportedCountryCode, string> = {
  US: "United States",
  ZA: "South Africa",
  UK: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
  NZ: "New Zealand",
  IE: "Ireland",
};

export function normalizeCountryParam(
  raw: string | null | undefined
): SupportedCountryCode | null {
  if (!raw) return null;
  const upper = raw.trim().toUpperCase();
  const code = upper === "GB" ? "UK" : upper;
  return (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(code)
    ? (code as SupportedCountryCode)
    : null;
}

export function countryPathSegment(code: SupportedCountryCode): string {
  return code.toLowerCase();
}

// Maps our public country codes to the storage codes used in the database.
// Most countries match 1:1, but the UK is stored as GB in the DB.
export const STORAGE_COUNTRY_CODE: Record<SupportedCountryCode, string> = {
  US: "US",
  ZA: "ZA",
  UK: "GB",
  AU: "AU",
  CA: "CA",
  NZ: "NZ",
  IE: "IE",
};

export function toStorageCountryCode(code: SupportedCountryCode): string {
  return STORAGE_COUNTRY_CODE[code] ?? code;
}

