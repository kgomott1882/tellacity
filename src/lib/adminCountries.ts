/** Admin businesses filter + table display (aligned codes with DB `country_code`). */

export const COUNTRIES = [
  { code: "ALL", label: "All countries" },
  { code: "ZA", label: "South Africa" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "NZ", label: "New Zealand" },
  { code: "IE", label: "Ireland" },
] as const;

export const COUNTRY_MAP: Record<string, string> = {
  ZA: "🇿🇦 South Africa",
  US: "🇺🇸 United States",
  GB: "🇬🇧 United Kingdom",
  CA: "🇨🇦 Canada",
  AU: "🇦🇺 Australia",
  NZ: "🇳🇿 New Zealand",
  IE: "🇮🇪 Ireland",
};

export function adminCountryDisplay(code: string | null | undefined): string {
  const raw = String(code ?? "").trim();
  if (!raw) return "—";
  const upper = raw.toUpperCase();
  return COUNTRY_MAP[upper] ?? raw;
}
