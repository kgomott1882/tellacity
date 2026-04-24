import { Resend } from "resend";

/**
 * Notify a business owner that one of their uploaded photos was rejected
 * during moderation review. Safe to fire-and-forget from an admin action —
 * the DB write is the source of truth; a failed email must NOT block the
 * moderation decision.
 *
 * Uses the same Resend setup as the rest of the app (see businessClaimEmail.ts).
 */

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

export type PhotoRejectionEmailInput = {
  /** Owner's email address (lower-cased before send). */
  toEmail: string;
  /** Owner's display name; falls back to "there" when empty. */
  ownerName?: string | null;
  /** Business name; falls back to "your business" when empty. */
  businessName?: string | null;
  /**
   * Admin-selected moderation reason
   * (e.g. "Collage / picmix", "Low quality", "Promotional content",
   * "Guideline violation"). Optional — when absent the email explains the
   * rejection in generic guideline terms.
   */
  moderationReason?: string | null;
};

export async function sendPhotoRejectedEmail(
  input: PhotoRejectionEmailInput
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[businessPhotoModerationEmail] RESEND_API_KEY missing; skipping email."
    );
    return;
  }

  const email = input.toEmail.trim().toLowerCase();
  if (!email) return;

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com"
  ).replace(/\/$/, "");
  const photosUrl = `${baseUrl}/business/dashboard/settings/photos`;
  const guidelinesUrl = `${baseUrl}/help/photo-guidelines`;

  const ownerName = (input.ownerName ?? "").trim() || "there";
  const businessName = (input.businessName ?? "").trim() || "your business";
  const reason = (input.moderationReason ?? "").trim();

  const resend = new Resend(apiKey);
  const from = resendFromHeader();

  const reasonBlock = reason
    ? `
          <tr>
            <td style="padding-top:16px;">
              <div style="background:#FEF3F2;border:1px solid #FEE4E2;border-radius:12px;padding:14px 16px;">
                <div style="font-size:12px;font-weight:600;color:#B42318;text-transform:uppercase;letter-spacing:0.04em;">Reason from our review team</div>
                <div style="margin-top:6px;font-size:15px;line-height:1.5;color:#7A271A;">${escapeHtml(reason)}</div>
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
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">A photo you uploaded wasn&apos;t approved</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(ownerName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            Thanks for adding photos to <strong>${escapeHtml(businessName)}</strong>. Our review team checked your recent upload and couldn&apos;t publish it because it doesn&apos;t meet the Tellacity photo guidelines.
          </td></tr>
          ${reasonBlock}
          <tr><td style="padding-top:20px;font-size:15px;line-height:1.6;color:#404040;">
            You can upload a replacement photo at any time — only approved photos appear on your public page, so the rest of your profile isn&apos;t affected.
          </td></tr>
          <tr><td style="padding-top:24px;">
            <a href="${photosUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9999px;">Manage photos</a>
          </td></tr>
          <tr><td style="padding-top:18px;font-size:14px;line-height:1.6;color:#606060;">
            Want to know what we look for? Read the
            <a href="${guidelinesUrl}" style="color:#1FAF9E;">Tellacity photo guidelines</a>.
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            Questions or think this was a mistake? Reply to this email or contact
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#1FAF9E;">${SUPPORT_EMAIL}</a>.
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
    `Thanks for adding photos to ${businessName}. Our review team checked your recent upload and couldn't publish it because it doesn't meet the Tellacity photo guidelines.`,
    reason ? `\nReason: ${reason}` : null,
    "",
    "You can upload a replacement photo at any time — only approved photos appear on your public page, so the rest of your profile isn't affected.",
    "",
    `Manage photos: ${photosUrl}`,
    `Photo guidelines: ${guidelinesUrl}`,
    "",
    `Questions? Email ${SUPPORT_EMAIL}.`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  try {
    const send = await resend.emails.send({
      from,
      to: email,
      subject: "A photo you uploaded wasn't approved",
      html,
      text,
    });
    if (send.error) {
      console.error(
        "[businessPhotoModerationEmail] send failed:",
        send.error
      );
    }
  } catch (e) {
    console.error("[businessPhotoModerationEmail] send exception:", e);
  }
}
