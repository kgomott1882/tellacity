/**
 * Reusable signature block for Tellacity automated moderation /
 * customer-facing operational emails.
 *
 * Two variants are supported via a single helper to avoid duplicating the
 * layout, asset, and email-client-safe markup:
 *
 *   - "trust_safety"     → Tellacity Trust & Safety / Moderation & Integrity Team
 *                          (enforcement: suspensions, warnings, rejections)
 *   - "business_support" → Tellacity Business Support / Business Support Team
 *                          (recovery: reinstatement, appeal-approved, restored)
 *
 * Designed for HTML email clients (table layout, inline styles, no external
 * CSS, no web fonts). Tone is intentionally minimal and neutral — closer to
 * Stripe / Supabase / OpenAI automated notices than to marketing copy.
 *
 * Wired into:
 *   - src/lib/adminBusinessSuspensionEmail.ts       (listing suspended)        [trust_safety]
 *   - src/lib/adminBusinessReinstatementEmail.ts    (listing reinstated)       [business_support]
 *   - src/lib/adminReviewGuidelinesWarningEmail.ts  (review warning / flagged) [trust_safety]
 *   - src/lib/businessPhotoModerationEmail.ts       (photo rejection)          [trust_safety]
 *
 * Do NOT use for transactional, marketing, OTP, or claim/onboarding emails.
 */

const DEFAULT_SITE = "https://tellacity.com";
const DEFAULT_GUIDELINES_PATH = "/business-guidelines";
const SUPPORT_EMAIL = "support@tellacity.com";
const AUTO_DISCLAIMER =
  "Automated message. Replies to this address are not monitored.";

export type TrustSafetySignatureVariant = "trust_safety" | "business_support";

const VARIANT_COPY: Record<
  TrustSafetySignatureVariant,
  { teamName: string; teamSubline: string }
> = {
  trust_safety: {
    teamName: "Tellacity Trust & Safety",
    teamSubline: "Moderation & Integrity Team",
  },
  business_support: {
    teamName: "Tellacity Business Support",
    teamSubline: "Business Support Team",
  },
};

export type TrustSafetySignatureOptions = {
  /**
   * Absolute base site URL (no trailing slash required). Used to build
   * the icon URL and Community Guidelines link. Falls back to
   * NEXT_PUBLIC_SITE_URL, then https://tellacity.com.
   */
  siteUrl?: string;
  /**
   * Path on the site for the Community Guidelines link.
   * Defaults to /business-guidelines. Pass /reviewer-guidelines or
   * /help/photo-guidelines to keep the footer link aligned with the
   * email body's primary guidelines link.
   */
  guidelinesPath?: string;
  /**
   * Which signature persona to render.
   *   - "trust_safety"     (default) — enforcement emails
   *   - "business_support" — recovery / reinstatement emails
   * Visual layout, asset, colors, and disclaimer remain identical
   * across variants; only the team name and subline change.
   */
  variant?: TrustSafetySignatureVariant;
};

function resolveBase(siteUrl?: string): string {
  const raw = (
    siteUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    DEFAULT_SITE
  ).trim();
  return (raw.length > 0 ? raw : DEFAULT_SITE).replace(/\/$/, "");
}

function resolveGuidelinesUrl(base: string, guidelinesPath?: string): string {
  const path = (guidelinesPath ?? DEFAULT_GUIDELINES_PATH).trim();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function resolveVariantCopy(
  variant?: TrustSafetySignatureVariant
): { teamName: string; teamSubline: string } {
  return VARIANT_COPY[variant ?? "trust_safety"];
}

/**
 * HTML signature block. Returns a self-contained <table> so it nests
 * safely inside both flat <body> emails and pre-existing wrapper tables.
 * Inline styles only; no <style> tag or external resources beyond the
 * /brand/appicon.png logo asset.
 */
export function trustSafetyEmailSignatureHtml(
  options: TrustSafetySignatureOptions = {}
): string {
  const base = resolveBase(options.siteUrl);
  const iconUrl = `${base}/brand/appicon.png`;
  const guidelinesUrl = resolveGuidelinesUrl(base, options.guidelinesPath);
  const { teamName, teamSubline } = resolveVariantCopy(options.variant);

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:28px;border-collapse:collapse;border-top:1px solid #e5e7eb;">
  <tr>
    <td style="padding-top:16px;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:1.5;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td valign="top" style="padding-right:12px;">
            <img src="${iconUrl}" width="28" height="28" alt="" style="display:block;border:0;outline:none;text-decoration:none;width:28px;height:28px;border-radius:6px;" />
          </td>
          <td valign="top" style="font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:1.5;">
            <div style="color:#111827;font-weight:600;font-size:13px;line-height:1.4;">${teamName}</div>
            <div style="color:#6b7280;font-size:12px;line-height:1.4;">${teamSubline}</div>
            <div style="margin-top:6px;color:#6b7280;font-size:12px;line-height:1.5;">
              <a href="mailto:${SUPPORT_EMAIL}" style="color:#374151;text-decoration:underline;">${SUPPORT_EMAIL}</a>
              <span style="color:#d1d5db;">&nbsp;·&nbsp;</span>
              <a href="${guidelinesUrl}" style="color:#374151;text-decoration:underline;">Community Guidelines</a>
            </div>
            <div style="margin-top:8px;color:#9ca3af;font-size:11px;line-height:1.5;">
              ${AUTO_DISCLAIMER}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

/**
 * Plain-text counterpart for the `text` field on Resend payloads that
 * include one. Mirrors the HTML signature without ASCII art.
 */
export function trustSafetyEmailSignatureText(
  options: TrustSafetySignatureOptions = {}
): string {
  const base = resolveBase(options.siteUrl);
  const guidelinesUrl = resolveGuidelinesUrl(base, options.guidelinesPath);
  const { teamName, teamSubline } = resolveVariantCopy(options.variant);
  return [
    "—",
    teamName,
    teamSubline,
    SUPPORT_EMAIL,
    `Community Guidelines: ${guidelinesUrl}`,
    AUTO_DISCLAIMER,
  ].join("\n");
}
