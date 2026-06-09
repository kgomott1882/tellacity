import { Resend } from "resend";
import {
  trustSafetyEmailSignatureHtml,
  trustSafetyEmailSignatureText,
} from "@/lib/trustSafetyEmailSignature";

const SUPPORT_EMAIL = "sales@tellacity.com";

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ArticleRejectionEmailInput = {
  toEmail: string;
  ownerName?: string | null;
  businessName?: string | null;
  articleTitle?: string | null;
  moderationReason?: string | null;
  articleId?: string | null;
};

export async function sendArticleRejectedEmail(
  input: ArticleRejectionEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[articleRejectionEmail] RESEND_API_KEY missing; skipping email.",
    );
    return;
  }

  const email = input.toEmail.trim().toLowerCase();
  if (!email) return;

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com"
  ).replace(/\/$/, "");
  const dashboardUrl = input.articleId
    ? `${baseUrl}/business/dashboard/articles/${encodeURIComponent(input.articleId)}/edit`
    : `${baseUrl}/business/dashboard/articles`;

  const ownerName = (input.ownerName ?? "").trim() || "there";
  const businessName = (input.businessName ?? "").trim() || "your business";
  const title = (input.articleTitle ?? "").trim() || "your article";
  const reason = (input.moderationReason ?? "").trim();

  const resend = new Resend(apiKey);
  const from = resendFromHeader();

  const reasonBlock = reason
    ? `
          <tr>
            <td style="padding-top:16px;">
              <div style="background:#FEF3F2;border:1px solid #FEE4E2;border-radius:12px;padding:14px 16px;">
                <div style="font-size:12px;font-weight:600;color:#B42318;text-transform:uppercase;letter-spacing:0.04em;">Reason from our review team</div>
                <div style="margin-top:6px;font-size:15px;line-height:1.5;color:#7A271A;white-space:pre-wrap;">${escapeHtml(reason)}</div>
              </div>
            </td>
          </tr>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8F4F0;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F4F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:32px;">
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">Your article wasn&apos;t approved</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(ownerName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            Our review team checked <strong>${escapeHtml(title)}</strong> for <strong>${escapeHtml(businessName)}</strong> and couldn&apos;t publish it yet. Your monthly article credit has been returned so you can edit and resubmit.
          </td></tr>
          ${reasonBlock}
          <tr><td style="padding-top:24px;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9999px;">Edit in dashboard</a>
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            Questions? Reply to this email or contact
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#1FAF9E;">${SUPPORT_EMAIL}</a>.
          </td></tr>
          <tr><td>${trustSafetyEmailSignatureHtml({ siteUrl: baseUrl })}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `Hi ${ownerName},`,
    "",
    `Our review team checked "${title}" for ${businessName} and couldn't publish it yet. Your monthly article credit has been returned so you can edit and resubmit.`,
    reason ? `\nReason: ${reason}` : null,
    "",
    `Edit in dashboard: ${dashboardUrl}`,
    "",
    `Questions? Email ${SUPPORT_EMAIL}.`,
    "",
    trustSafetyEmailSignatureText({ siteUrl: baseUrl }),
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  try {
    const send = await resend.emails.send({
      from,
      to: email,
      subject: "Your article wasn't approved",
      html,
      text,
    });
    if (send.error) {
      console.error("[articleRejectionEmail] send failed:", send.error);
    }
  } catch (e) {
    console.error("[articleRejectionEmail] send exception:", e);
  }
}
