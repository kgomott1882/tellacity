/** When `NEXT_PUBLIC_APP_URL` is unset, email links still need a valid origin (relative URLs break in clients). */
export const PUBLIC_APP_ORIGIN_FALLBACK = "https://tellacity.com";

/**
 * Canonical site origin for links in transactional email (invite links, widget CTAs).
 * Always absolute , never rely on empty env in production/cron.
 */
export function getPublicAppOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return PUBLIC_APP_ORIGIN_FALLBACK;
}

/**
 * Absolute URL to leave a review for a business (slug = businesses.slug).
 * Canonical path is `/write-review/[slug]` , not `/b/[slug]/write-review` (legacy; redirects).
 */
export function getPublicWriteReviewUrl(
  origin: string,
  businessSlug: string,
): string {
  const base = String(origin ?? "").replace(/\/$/, "");
  const slug = String(businessSlug ?? "").trim();
  const root = base || PUBLIC_APP_ORIGIN_FALLBACK;
  if (!slug) return `${root}/write-review`;
  return `${root}/write-review/${encodeURIComponent(slug)}`;
}

/**
 * Invite finalization page (InviteFinalReviewForm). Optional `rating` pre-fills stars (1–5).
 */
export function getInviteFinalizeUrl(
  origin: string,
  token: string,
  rating?: number,
): string {
  const base = String(origin ?? "").replace(/\/$/, "") || PUBLIC_APP_ORIGIN_FALLBACK;
  const u = new URL(`${base}/review/invite`);
  u.searchParams.set("token", token.trim());
  if (
    typeof rating === "number" &&
    Number.isFinite(rating) &&
    rating >= 1 &&
    rating <= 5
  ) {
    u.searchParams.set("rating", String(Math.round(rating)));
  }
  return u.toString();
}

/** Bump when replacing `/public/brand/appicon.png` so browsers pick up the new file. */
const TELLACITY_BRAND_ICON_CACHE = "v=4";

/**
 * Tellacity mark in `/public/brand/appicon.png` , website widgets, review strip, “Verified by” rows.
 * (Path only; use `TELLACITY_BRAND_ICON_SRC` for `<img src>` / `next/image`.)
 */
export const TELLACITY_BRAND_ICON_PATH = "/brand/appicon.png";

/** Same file; alias for review-strip-specific call sites. */
export const TELLACITY_APP_ICON_PATH = TELLACITY_BRAND_ICON_PATH;

/** Dashboard / navbar wordmark (`/public/brand/Tellacity -Business Logo.png`). */
export const TELLACITY_BUSINESS_WORDMARK_PATH = "/brand/Tellacity%20-Business%20Logo.png";

/** Primary Tellacity mark for email trust-badge layout (`/public/brand/TELLACITY LOGO 1A.png`). */
export const TELLACITY_TRUST_BADGE_LOGO_PATH = "/brand/TELLACITY%20LOGO%201A.png";

/** Use in client components so cache invalidates after icon updates. */
export const TELLACITY_BRAND_ICON_SRC = `${TELLACITY_BRAND_ICON_PATH}?${TELLACITY_BRAND_ICON_CACHE}`;

/** Outlined “Leave a Review” CTA in widget emails (frame + text, no fill). */
export const EMAIL_WIDGET_CTA_BORDER = "#2D2D2D";
export const EMAIL_WIDGET_CTA_TEXT = "#2D2D2D";

/**
 * Absolute URL for the Tellacity mark in HTML emails (clients require absolute img src).
 */
function brandIconUrlWithCache(root: string): string {
  return `${root}${TELLACITY_BRAND_ICON_PATH}?${TELLACITY_BRAND_ICON_CACHE}`;
}

export function getTellacityBrandIconUrl(baseUrl: string | undefined | null): string {
  const root =
    baseUrl && baseUrl.trim().length > 0
      ? baseUrl.replace(/\/$/, "")
      : PUBLIC_APP_ORIGIN_FALLBACK;
  return brandIconUrlWithCache(root);
}

/** Absolute URL for app icon in HTML emails (review-us strip). */
export function getTellacityAppIconUrl(baseUrl: string | undefined | null): string {
  const root =
    baseUrl && baseUrl.trim().length > 0
      ? baseUrl.replace(/\/$/, "")
      : PUBLIC_APP_ORIGIN_FALLBACK;
  return brandIconUrlWithCache(root);
}

/** Absolute URL for the Tellacity Business wordmark in HTML emails. */
export function getTellacityBusinessWordmarkUrl(baseUrl: string | undefined | null): string {
  const root =
    baseUrl && baseUrl.trim().length > 0
      ? baseUrl.replace(/\/$/, "")
      : PUBLIC_APP_ORIGIN_FALLBACK;
  return `${root}${TELLACITY_BUSINESS_WORDMARK_PATH}`;
}

/** Absolute URL for trust-badge email widget logo (TELLACITY LOGO 1A). */
export function getTellacityTrustBadgeLogoUrl(baseUrl: string | undefined | null): string {
  const root =
    baseUrl && baseUrl.trim().length > 0
      ? baseUrl.replace(/\/$/, "")
      : PUBLIC_APP_ORIGIN_FALLBACK;
  return `${root}${TELLACITY_TRUST_BADGE_LOGO_PATH}`;
}
