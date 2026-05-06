import { Resend } from "resend";
import { resendFromHeader } from "@/lib/businessDomainVerification";
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
  /** Optional admin-provided context shown in the email */
  customNote?: string | null;
  siteUrl?: string;
};

/**
 * Notifies the business owner that previously applied restrictions on their
 * Tellacity listing have been removed and the listing is active again.
 * Admin-triggered from /admin/businesses (Activate / Approved actions on a
 * currently suspended listing).
 */
export async function sendAdminBusinessReinstatementEmail(
  params: SendParams
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const base = (params.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE).replace(/\/$/, "");
  const dashboardUrl = `${base}/business/dashboard`;
  const guidelinesUrl = `${base}/business-guidelines`;

  const subject = "Your Tellacity business listing has been reinstated";
  const biz = esc(params.businessName.trim() || "your business listing");
  const customTrim = (params.customNote ?? "").trim() || null;

  const customParagraph = customTrim
    ? `<p><strong>Note from our team:</strong> ${esc(customTrim)}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html><body style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #111827;">
  <p>Hello,</p>
  <p>
    Good news — the previous restrictions on <strong>${biz}</strong> have been
    <strong>removed</strong>. Your business listing is now active again on Tellacity
    and will appear in public results as normal.
  </p>
  <p>
    Reviews on the listing are once again open to your customers, and you can use
    all standard dashboard features.
  </p>
  ${customParagraph}
  <p>
    To keep your listing in good standing, please review our
    <a href="${esc(guidelinesUrl)}">business guidelines</a> from time to time.
  </p>
  <p>
    You can manage your listing here: <a href="${esc(dashboardUrl)}">${esc(dashboardUrl)}</a>
  </p>
  <p>
    This is an automated message and this inbox is not monitored.
  </p>
  <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">— Tellacity Business Support</p>
  ${trustSafetyEmailSignatureHtml({ siteUrl: base, guidelinesPath: "/business-guidelines", variant: "business_support" })}
</body></html>`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: resendFromHeader(),
    to: [params.to],
    subject,
    html,
  });

  if (error) {
    console.error("[adminBusinessReinstatementEmail] Resend:", error);
    return { ok: false, error: error.message ?? "Failed to send email" };
  }
  return { ok: true };
}
