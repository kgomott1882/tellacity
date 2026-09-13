/**
 * Public SEO helpers for business profile URLs (`/b/[slug]`).
 *
 * Index / sitemap quality gate (2026-09):
 * - Sitemap + indexable when claimed OR has reviews OR description length > 100
 * - Thin shells (unclaimed + 0 reviews + short/empty description) are noindex
 *   and excluded from sitemaps.
 */

/** Utility/review-form routes should never compete with `/b/[slug]` in the index. */
export const WRITE_REVIEW_ROBOTS = { index: false, follow: true } as const;

/** Min owner/about copy length to treat a listing as non-thin for SEO. */
export const BUSINESS_SEO_MIN_DESCRIPTION_LENGTH = 100;

/** Junk/placeholder slugs from bulk imports, skip in sitemaps only. */
const GARBAGE_SLUG_RE = /^(\d+|business\d*|unknown|unitedstates\d*)$/i;
const MIN_SLUG_LENGTH = 3;

export function isIndexableBusinessSlug(slug: string | null | undefined): boolean {
  const s = String(slug ?? "").trim().toLowerCase();
  if (s.length < MIN_SLUG_LENGTH) return false;
  if (GARBAGE_SLUG_RE.test(s)) return false;
  return true;
}

export type BusinessSeoQualityInput = {
  owner_id?: string | null;
  is_claimed?: boolean | null;
  review_count?: number | null;
  description?: string | null;
};

export function isBusinessClaimed(
  row: Pick<BusinessSeoQualityInput, "owner_id" | "is_claimed">,
): boolean {
  if (row.is_claimed === true) return true;
  return Boolean(String(row.owner_id ?? "").trim());
}

export function businessDescriptionLength(
  description: string | null | undefined,
): number {
  return String(description ?? "").trim().length;
}

/**
 * Eligible for sitemap + default index: claimed, reviewed, or substantive description.
 */
export function isBusinessSeoQuality(row: BusinessSeoQualityInput): boolean {
  if (isBusinessClaimed(row)) return true;
  if (Number(row.review_count ?? 0) > 0) return true;
  if (businessDescriptionLength(row.description) > BUSINESS_SEO_MIN_DESCRIPTION_LENGTH) {
    return true;
  }
  return false;
}

/**
 * Thin scraped shell: unclaimed, no reviews, and missing/short description.
 * These stay publicly reachable but must not be indexed.
 */
export function isThinBusinessProfile(row: BusinessSeoQualityInput): boolean {
  return !isBusinessSeoQuality(row);
}

export function businessProfileRobots(row?: BusinessSeoQualityInput | null) {
  if (row && isThinBusinessProfile(row)) {
    return { index: false, follow: true } as const;
  }
  return { index: true, follow: true } as const;
}

/** Shard size for `/business-sitemaps/[id].xml`. */
export const BUSINESS_SITEMAP_PAGE_SIZE = 1000;
