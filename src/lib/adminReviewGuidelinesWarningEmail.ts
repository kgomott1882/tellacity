import { Resend } from "resend";
import { resendFromHeader } from "@/lib/businessDomainVerification";
import {
  ADMIN_REVIEW_WARNING_REASON_OPTIONS,
  type AdminReviewWarningReasonKey,
} from "@/lib/adminReviewWarningReasons";

const SITE = "https://tellacity.com";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SendParams = {
  to: string;
  businessName: string;
  reasonKey: AdminReviewWarningReasonKey;
  /** Optional extra context for the reviewer */
  customNote?: string | null;
  siteUrl?: string;
};

function reasonEmailParagraph(
  reasonKey: AdminReviewWarningReasonKey,
  customNote: string | null
): string {
  const row = ADMIN_REVIEW_WARNING_REASON_OPTIONS.find((o) => o.key === reasonKey);
  const line = row?.emailLine?.trim() ?? "";
  const extra = (customNote ?? "").trim();
  let inner = "";
  if (line) {
    inner += `<p><strong>More specifically:</strong> ${esc(line)}</p>`;
  }
  const soft = row?.softRecipientNote?.trim();
  if (soft) {
    inner += `<p>${esc(soft)}</p>`;
  }
  if (extra) {
    inner += `<p><strong>Additional note:</strong> ${esc(extra)}</p>`;
  }
  return inner;
}

/**
 * No-reply notice: review may not meet Tellacity community standards (perceived fake/promotional etc.).
 * Admin-triggered from /admin/reviews.
 */
export async function sendAdminReviewGuidelinesWarningEmail(
  params: SendParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const base = (params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE).replace(/\/$/, "");
  const guidelinesUrl = `${base}/reviewer-guidelines`;

  const subject = "Notice regarding your review on Tellacity";
  const biz = esc(params.businessName.trim() || "the business");
  const customTrim = (params.customNote ?? "").trim() || null;
  const specifics = reasonEmailParagraph(params.reasonKey, customTrim);

  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #111827;">
  <p>Hello,</p>
  <p>
    Our moderation team has reviewed content associated with your review of <strong>${biz}</strong> on Tellacity.
    It may not meet our <a href="${esc(guidelinesUrl)}">community guidelines</a>.
  </p>
  ${specifics}
  <p>As a result, the review may be removed or restricted.</p>
  <p>
    This is an automated message and this inbox is not monitored. If you have questions, please visit the Help section in your Tellacity account.
  </p>
  <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">— Tellacity Trust &amp; Safety</p>
</body></html>`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: resendFromHeader(),
    to: [params.to],
    subject,
    html,
  });

  if (error) {
    console.error("[adminReviewGuidelinesWarningEmail] Resend:", error);
    return { ok: false, error: error.message ?? "Failed to send email" };
  }
  return { ok: true };
}
