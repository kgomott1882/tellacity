/**
 * Public SEO helpers for business profile URLs (`/b/[slug]`).
 *
 * Product strategy (Trustpilot-style): list businesses before they are claimed
 * or reviewed so owners can discover Tellacity and claim later. Do NOT noindex
 * profiles simply because they have zero reviews or no owner.
 *
 * Google may still show "Crawled - currently not indexed" for some URLs while
 * domain authority grows, that is not the same as us blocking indexing.
 */

/** Utility/review-form routes should never compete with `/b/[slug]` in the index. */
export const WRITE_REVIEW_ROBOTS = { index: false, follow: true } as const;

/** Junk/placeholder slugs from bulk imports, skip in sitemaps only. */
const GARBAGE_SLUG_RE = /^(\d+|business\d*|unknown|unitedstates\d*)$/i;
const MIN_SLUG_LENGTH = 3;

export function isIndexableBusinessSlug(slug: string | null | undefined): boolean {
  const s = String(slug ?? "").trim().toLowerCase();
  if (s.length < MIN_SLUG_LENGTH) return false;
  if (GARBAGE_SLUG_RE.test(s)) return false;
  return true;
}

/** Stopgap: active public profile URLs stay indexable on their existing slug. */
export function businessProfileRobots() {
  return { index: true, follow: true } as const;
}
