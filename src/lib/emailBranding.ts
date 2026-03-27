/** Dark Tellacity mark in /public — embed widgets (not shown in review-request email footer). */
export const TELLACITY_BRAND_ICON_PATH = "/brand/favicon.black.png";

/** Outlined “Leave a Review” CTA in widget emails (frame + text, no fill). */
export const EMAIL_WIDGET_CTA_BORDER = "#2D2D2D";
export const EMAIL_WIDGET_CTA_TEXT = "#2D2D2D";

/**
 * Absolute URL for the Tellacity mark in HTML emails (clients require absolute img src).
 */
export function getTellacityBrandIconUrl(baseUrl: string | undefined | null): string {
  const root =
    baseUrl && baseUrl.trim().length > 0 ? baseUrl.replace(/\/$/, "") : "https://tellacity.com";
  return `${root}${TELLACITY_BRAND_ICON_PATH}`;
}
