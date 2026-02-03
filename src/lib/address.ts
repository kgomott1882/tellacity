/**
 * Map country code to full country name. Returns the code if unknown.
 */
export function getCountryName(code: string | null | undefined): string {
  if (!code || typeof code !== "string") return "";
  const normalized = code.trim().toUpperCase();
  if (!normalized) return "";
  const map: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    ZA: "South Africa",
    AU: "Australia",
    CA: "Canada",
    NZ: "New Zealand",
    IE: "Ireland",
  };
  return map[normalized] ?? normalized;
}

const EMPTY_PLACEHOLDERS = ["[unknown]", "[null]", "unknown", "n/a", "na"];

function treatAsEmpty(s: string): string {
  const t = (s ?? "").trim().toLowerCase();
  if (!t) return "";
  if (EMPTY_PLACEHOLDERS.some((p) => t === p.toLowerCase())) return "";
  return (s ?? "").trim();
}

/**
 * Format business location for display.
 * 1) Full address with city and country name
 * 2) City with country name
 * 3) Country name only (never country code)
 * Placeholders like "[unknown]" are treated as empty.
 */
export function formatBusinessAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  countryCode: string | null | undefined,
  getCountry: (code: string | null | undefined) => string = getCountryName
): string {
  const addr = treatAsEmpty((address ?? "").toString());
  const c = treatAsEmpty((city ?? "").toString());
  const countryName = getCountry(countryCode);

  if (addr && countryName) {
    return c ? `${addr}, ${c}, ${countryName}` : `${addr}, ${countryName}`;
  }
  if (addr) {
    return countryName ? `${addr}, ${countryName}` : addr;
  }
  if (c && countryName) {
    return `${c}, ${countryName}`;
  }
  if (countryName) {
    return countryName;
  }
  return "";
}
