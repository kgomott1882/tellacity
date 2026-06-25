import { Resend } from "resend";
import { getPublicAppOrigin } from "@/lib/emailBranding";
import { resendFromHeader } from "@/lib/businessDomainVerification";

const SUPPORT_EMAIL = "sales@tellacity.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ActivationReminderEmailInput = {
  toEmail: string;
  ownerName?: string | null;
  businessName?: string | null;
};

export type ActivationReminderEmailResult =
  | { status: "sent"; messageId?: string }
  | { status: "skipped" }
  | { status: "failed"; error: string };

export async function sendActivationReminderEmail(
  input: ActivationReminderEmailInput,
): Promise<ActivationReminderEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[businessActivationReminderEmail] RESEND_API_KEY missing; skipping email.",
    );
    return { status: "skipped" };
  }

  const email = input.toEmail.trim().toLowerCase();
  if (!email) return { status: "skipped" };

  const origin = getPublicAppOrigin();
  const inviteUrl = `${origin}/business/dashboard/get-reviews/overview#send-invite`;
  const preferencesUrl = `${origin}/business/dashboard/settings/notifications`;

  const ownerName = (input.ownerName ?? "").trim() || "there";
  const businessName =
    (input.businessName ?? "").trim() || "your business";

  const resend = new Resend(apiKey);
  const from = resendFromHeader();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8F4F0;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F4F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:32px;">
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">You&apos;re set up — send your first invite</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(ownerName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            Your Tellacity workspace for <strong>${escapeHtml(businessName)}</strong> is ready. The fastest way to start collecting reviews is to send one invitation to a recent customer.
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            It only takes a minute: enter their email, and we&apos;ll send a branded review request on your behalf.
          </td></tr>
          <tr><td style="padding-top:24px;">
            <a href="${inviteUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9999px;">Send your first invite</a>
          </td></tr>
          <tr><td style="padding-top:18px;font-size:14px;line-height:1.6;color:#606060;">
            Or open your dashboard: <a href="${inviteUrl}" style="color:#1FAF9E;">${escapeHtml(inviteUrl)}</a>
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            Questions? Reply to this email or reach us at
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#1FAF9E;">${SUPPORT_EMAIL}</a>.
          </td></tr>
          <tr><td style="padding-top:16px;font-size:12px;line-height:1.5;color:#999;">
            Manage email preferences:
            <a href="${preferencesUrl}" style="color:#1FAF9E;">${escapeHtml(preferencesUrl)}</a>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  const text = [
    `Hi ${ownerName},`,
    "",
    `Your Tellacity workspace for ${businessName} is ready. The fastest way to start collecting reviews is to send one invitation to a recent customer.`,
    "",
    "It only takes a minute: enter their email, and we'll send a branded review request on your behalf.",
    "",
    `Send your first invite: ${inviteUrl}`,
    "",
    `Questions? Email ${SUPPORT_EMAIL}.`,
    "",
    `Manage email preferences: ${preferencesUrl}`,
  ].join("\n");

  try {
    const send = await resend.emails.send({
      from,
      to: email,
      subject: "Send your first review invite",
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${preferencesUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (send.error) {
      console.error("[businessActivationReminderEmail] send failed:", send.error);
      return {
        status: "failed",
        error:
          typeof send.error === "object" &&
          send.error !== null &&
          "message" in send.error
            ? String((send.error as { message: unknown }).message)
            : "Resend returned an error",
      };
    }
    const messageId =
      typeof send.data?.id === "string" ? send.data.id : undefined;
    return { status: "sent", messageId };
  } catch (e) {
    console.error("[businessActivationReminderEmail] send exception:", e);
    return {
      status: "failed",
      error: e instanceof Error ? e.message : "Email send exception",
    };
  }
}
