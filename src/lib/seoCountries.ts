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
  const code = raw.trim().toUpperCase();
  return (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(code)
    ? (code as SupportedCountryCode)
    : null;
}

export function countryPathSegment(code: SupportedCountryCode): string {
  return code.toLowerCase();
}

