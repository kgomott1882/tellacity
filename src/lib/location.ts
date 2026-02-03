/**
 * Map country code (e.g. ZA, US) to full country name for display.
 * Never show raw codes to users.
 */
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  ZA: "South Africa",
  AU: "Australia",
  CA: "Canada",
  NZ: "New Zealand",
  IE: "Ireland",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  IN: "India",
  KE: "Kenya",
  NG: "Nigeria",
  GH: "Ghana",
  EG: "Egypt",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  JP: "Japan",
  CN: "China",
  SG: "Singapore",
  MY: "Malaysia",
  BR: "Brazil",
  MX: "Mexico",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  PL: "Poland",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
};

export function getCountryName(
  code: string | null | undefined
): string {
  if (!code || typeof code !== "string") return "";
  const name = COUNTRY_NAMES[code.toUpperCase().trim()];
  return name ?? code;
}

/**
 * Display location: primary = full address, secondary = city, fallback = country name.
 * Never shows raw country codes.
 */
export function getDisplayLocation(options: {
  address?: string | null;
  city?: string | null;
  countryCode?: string | null;
}): string {
  const { address, city, countryCode } = options;
  const a = (address ?? "").toString().trim();
  const c = (city ?? "").toString().trim();
  const name = getCountryName(countryCode);
  if (a) return a;
  if (c) return c;
  if (name) return name;
  return "";
}
