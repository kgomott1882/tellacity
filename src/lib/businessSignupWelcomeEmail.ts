import { Resend } from "resend";

const SALES_NOTIFY_EMAIL = "sales@tellacity.com";

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

/**
 * After business signup verification: welcome the user and notify sales (system-generated, not “from” the user).
 * Does not throw — signup must succeed even if email fails.
 */
export async function sendBusinessSignupWelcomeEmails(input: {
  toEmail: string;
  businessName: string;
  fullName: string;
  countryCode?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[businessSignupWelcomeEmail] RESEND_API_KEY missing; skipping welcome emails.",
    );
    return;
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com"
  ).replace(/\/$/, "");
  const loginUrl = `${baseUrl}/business/login`;
  const safeName = input.fullName.trim() || "there";
  const bizName = input.businessName.trim() || "your business";
  const country =
    typeof input.countryCode === "string" && input.countryCode.trim()
      ? input.countryCode.trim().toUpperCase()
      : "";

  const resend = new Resend(apiKey);
  const from = resendFromHeader();

  const userHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8F4F0;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F4F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:32px;">
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">Welcome to Tellacity Business</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(safeName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            Your account for <strong>${escapeHtml(bizName)}</strong> is ready. You can sign in any time with your work email and the password you chose.
          </td></tr>
          ${
            country
              ? `<tr><td style="padding-top:12px;font-size:14px;color:#666;">Country: ${escapeHtml(country)}</td></tr>`
              : ""
          }
          <tr><td style="padding-top:28px;">
            <a href="${loginUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;">Go to sign in</a>
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            If you didn’t create this account, contact us at <a href="mailto:${SALES_NOTIFY_EMAIL}" style="color:#1FAF9E;">${SALES_NOTIFY_EMAIL}</a>.
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    const userSend = await resend.emails.send({
      from,
      to: input.toEmail.trim().toLowerCase(),
      subject: "Your Tellacity Business account is ready",
      html: userHtml,
    });
    if (userSend.error) {
      console.error(
        "[businessSignupWelcomeEmail] user send failed:",
        userSend.error,
      );
    }
  } catch (e) {
    console.error("[businessSignupWelcomeEmail] user send exception:", e);
  }

  // Internal copy: system sender only (not “from” the customer). Plain summary for ops.
  const internalText = [
    "New Tellacity Business account registered.",
    "",
    `Business name: ${input.businessName.trim() || "—"}`,
    `Work email: ${input.toEmail.trim().toLowerCase()}`,
    `Contact name: ${input.fullName.trim() || "—"}`,
    country ? `Country: ${country}` : null,
    `Time (UTC): ${new Date().toISOString()}`,
    "",
    "This is an automated internal notice.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const salesSend = await resend.emails.send({
      from,
      to: SALES_NOTIFY_EMAIL,
      subject: "New Tellacity Business signup",
      text: internalText,
    });
    if (salesSend.error) {
      console.error(
        "[businessSignupWelcomeEmail] sales notify failed:",
        salesSend.error,
      );
    }
  } catch (e) {
    console.error("[businessSignupWelcomeEmail] sales notify exception:", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
