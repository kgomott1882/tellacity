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

/** True when a stored location or label field is a DB placeholder, not real copy. */
export function isPlaceholderLocation(value: string | null | undefined): boolean {
  const t = (value ?? "").trim().toLowerCase();
  if (!t) return true;
  return EMPTY_PLACEHOLDERS.some((p) => t === p.toLowerCase());
}

/** Strip placeholder tokens from address, city, and similar fields for public display. */
export function cleanLocationField(value: string | null | undefined): string {
  return treatAsEmpty((value ?? "").toString());
}

/** Public business name with placeholder fallbacks removed. */
export function cleanBusinessDisplayName(value: string | null | undefined): string {
  const cleaned = cleanLocationField(value);
  return cleaned || "Business";
}

function treatAsEmpty(s: string): string {
  const t = (s ?? "").trim().toLowerCase();
  if (!t) return "";
  if (EMPTY_PLACEHOLDERS.some((p) => t === p.toLowerCase())) return "";
  return (s ?? "").trim();
}

function splitCommaSegments(s: string): string[] {
  return s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Drop comma-separated fragments already present (stops repeated country/city). */
function appendLocationSegments(
  segments: string[],
  raw: string | null | undefined,
): void {
  const t = treatAsEmpty((raw ?? "").toString());
  if (!t) return;
  for (const part of splitCommaSegments(t)) {
    const pl = part.toLowerCase();
    if (segments.some((s) => s.toLowerCase() === pl)) continue;
    segments.push(part);
  }
}

function buildLocationSegments(
  address: string | null | undefined,
  city: string | null | undefined,
  countryCode: string | null | undefined,
  getCountry: (code: string | null | undefined) => string,
): string[] {
  const segments: string[] = [];
  appendLocationSegments(segments, (address ?? "").toString());
  appendLocationSegments(segments, (city ?? "").toString());
  const countryName = treatAsEmpty(getCountry(countryCode));
  if (countryName) {
    appendLocationSegments(segments, countryName);
  }
  return segments;
}

function locationSegmentsToDisplayLines(segments: string[]): string[] {
  if (segments.length === 0) return [];
  if (segments.length === 1) return [segments[0]!];
  if (segments.length === 2) return [segments[0]!, segments[1]!];
  if (segments.length === 3) return [segments[0]!, segments[1]!, segments[2]!];
  return [
    segments[0]!,
    segments.slice(1, -1).join(", "),
    segments[segments.length - 1]!,
  ];
}

/**
 * Format business location for display.
 * 1) Full address with city and country name
 * 2) City with country name
 * 3) Country name only (never country code)
 * Placeholders like "[unknown]" are treated as empty.
 * Duplicate segments (e.g. repeated country in source data) are removed.
 */
export function formatBusinessAddress(
  address: string | null | undefined,
  city: string | null | undefined,
  countryCode: string | null | undefined,
  getCountry: (code: string | null | undefined) => string = getCountryName
): string {
  return buildLocationSegments(address, city, countryCode, getCountry).join(", ");
}

/**
 * Multi-line location for directory cards (street / middle / country style).
 */
export function formatBusinessAddressLines(
  address: string | null | undefined,
  city: string | null | undefined,
  countryCode: string | null | undefined,
  getCountry: (code: string | null | undefined) => string = getCountryName,
): string[] {
  return locationSegmentsToDisplayLines(
    buildLocationSegments(address, city, countryCode, getCountry),
  );
}

/** Single stored display string → deduped lines (fallback when address/city/country columns are empty). */
export function formatDisplayLocationLines(raw: string | null | undefined): string[] {
  const segments: string[] = [];
  appendLocationSegments(segments, raw);
  return locationSegmentsToDisplayLines(segments);
}
