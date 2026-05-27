/** Same rotating slugs as the homepage hero; keep in sync with `app/page.tsx` UI. */
export const HOME_ROTATING_BEST_IN_SLUGS = [
  "banking",
  "insurance",
  "restaurants-and-bars",
  "internet-and-software",
  "banking-and-money",
  "cars-and-trucks",
] as const;

/** Homepage Best-in row from `home_best_in_cache.businesses` (from `business_review_metrics_v`). */
export type HomeBestInBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  trust_score: number;
  review_count: number;
  logo_url: string | null;
  /** Optional: cache or client may set when different from `logo_url`. */
  resolved_logo_url?: string | null;
  website_display?: string | null;
};

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t !== "" ? t : null;
}

/**
 * Normalize one cached JSON object: always numeric `trust_score` / `review_count` (jsonb often returns strings).
 */
export function normalizeHomeBestInBusiness(raw: unknown): HomeBestInBusiness | null {
  if (raw === null || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id =
    typeof r.id === "string"
      ? strOrNull(r.id)
      : r.id != null && String(r.id).trim() !== ""
        ? String(r.id).trim()
        : null;
  if (!id) return null;

  const name = strOrNull(r.name) ?? "-";
  const slugRaw = strOrNull(r.slug);
  const slug = (slugRaw ?? "").toLowerCase() || id;

  return {
    id,
    name,
    slug,
    website: strOrNull(r.website),
    trust_score: Number(r.trust_score ?? 0) || 0,
    review_count: Number(r.review_count ?? 0) || 0,
    logo_url: strOrNull(r.logo_url),
    resolved_logo_url: strOrNull(r.resolved_logo_url),
    website_display: strOrNull(r.website_display),
  };
}

export function normalizeHomeBestInBusinessList(raw: unknown): HomeBestInBusiness[] {
  if (!Array.isArray(raw)) return [];
  const out: HomeBestInBusiness[] = [];
  for (const item of raw) {
    const n = normalizeHomeBestInBusiness(item);
    if (n) out.push(n);
  }
  return out;
}
