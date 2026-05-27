import { Resend } from "resend";
import { resendFromHeader } from "@/lib/businessDomainVerification";
import {
  ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS,
  type AdminBusinessSuspensionReasonKey,
} from "@/lib/adminBusinessSuspensionReasons";
import { trustSafetyEmailSignatureHtml } from "@/lib/trustSafetyEmailSignature";

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
  reasonKey: AdminBusinessSuspensionReasonKey;
  /** Optional admin-provided context shown in the email */
  customNote?: string | null;
  siteUrl?: string;
};

function reasonEmailParagraph(
  reasonKey: AdminBusinessSuspensionReasonKey,
  customNote: string | null
): string {
  const row = ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS.find((o) => o.key === reasonKey);
  const line = row?.emailLine?.trim() ?? "";
  const extra = (customNote ?? "").trim();
  let inner = "";
  if (line) {
    inner += `<p><strong>Reason:</strong> ${esc(line)}</p>`;
  }
  const soft = row?.softRecipientNote?.trim();
  if (soft) {
    inner += `<p>${esc(soft)}</p>`;
  }
  if (extra) {
    inner += `<p><strong>Additional note from our team:</strong> ${esc(extra)}</p>`;
  }
  return inner;
}

/**
 * Notifies the registered business owner that their listing has been suspended by an admin.
 * Admin-triggered from /admin/businesses.
 */
export async function sendAdminBusinessSuspensionEmail(
  params: SendParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const base = (params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE).replace(/\/$/, "");
  const guidelinesUrl = `${base}/business-guidelines`;
  const dashboardUrl = `${base}/business/dashboard`;

  const subject = "Your Tellacity business listing has been suspended";
  const biz = esc(params.businessName.trim() || "your business listing");
  const customTrim = (params.customNote ?? "").trim() || null;
  const specifics = reasonEmailParagraph(params.reasonKey, customTrim);

  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #111827;">
  <p>Hello,</p>
  <p>
    Our trust &amp; safety team has reviewed activity associated with <strong>${biz}</strong> on Tellacity,
    and your business listing has been <strong>suspended</strong>.
    During this period the listing will not appear in public results and reviews on it may be restricted.
  </p>
  ${specifics}
  <p>
    Please review our <a href="${esc(guidelinesUrl)}">business guidelines</a> and address any underlying concerns.
    Once resolved, you can reply to support so we can re-evaluate the listing.
  </p>
  <p>
    You can still access your <a href="${esc(dashboardUrl)}">business dashboard</a> while your listing is suspended.
  </p>
  <p>
    This is an automated message and this inbox is not monitored.
  </p>
  <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">,  Tellacity Trust &amp; Safety</p>
  ${trustSafetyEmailSignatureHtml({ siteUrl: base, guidelinesPath: "/business-guidelines" })}
</body></html>`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: resendFromHeader(),
    to: [params.to],
    subject,
    html,
  });

  if (error) {
    console.error("[adminBusinessSuspensionEmail] Resend:", error);
    return { ok: false, error: error.message ?? "Failed to send email" };
  }
  return { ok: true };
}
