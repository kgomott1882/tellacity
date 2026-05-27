import { Resend } from "resend";

/**
 * Notify a business owner on the free plan that their uploaded photos are
 * about to be removed under the 30-day retention policy. This email is
 * triggered by an admin from `/admin/photo-expiry`, the DB / deletion job
 * remains the source of truth, so a failed email must never block the
 * underlying retention logic.
 *
 * Matches the setup used by {@link import("./businessPhotoModerationEmail").sendPhotoRejectedEmail}.
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

function formatEarliestRemovalAt(iso: string | null | undefined): string {
  if (!iso) return "within the next 24 hours";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "within the next 24 hours";
  try {
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return d.toISOString();
  }
}

export type PhotoExpiryEmailInput = {
  /** Owner's email address (lower-cased before send). */
  toEmail: string;
  /** Owner's display name; falls back to "there" when empty. */
  ownerName?: string | null;
  /** Business name; falls back to "your business" when empty. */
  businessName?: string | null;
  /** Number of photos that are about to be removed. */
  expiringCount: number;
  /**
   * ISO timestamp of the earliest photo's 30-day cutoff. Rendered as a
   * localized "Tue, Apr 25, 10:14 AM GMT+2" string in the copy so the owner
   * knows exactly when removal begins. When absent or invalid, we fall
   * back to a generic "within the next 24 hours".
   */
  earliestRemovalAtIso?: string | null;
};

export type PhotoExpiryEmailResult =
  | { status: "sent"; id?: string }
  | { status: "skipped_no_api_key" }
  | { status: "skipped_no_email" }
  | { status: "failed"; error: string };

export async function sendPhotoExpiryReminderEmail(
  input: PhotoExpiryEmailInput,
): Promise<PhotoExpiryEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[businessPhotoExpiryEmail] RESEND_API_KEY missing; skipping email.",
    );
    return { status: "skipped_no_api_key" };
  }

  const email = input.toEmail.trim().toLowerCase();
  if (!email) return { status: "skipped_no_email" };

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com"
  ).replace(/\/$/, "");
  // `source=upload_limit` tells the billing page to show the "upload more
  // photos" upgrade framing, same context we already use for the
  // upload-limit-reached nudge.
  const upgradeUrl = `${baseUrl}/business/dashboard/billing?source=upload_limit`;
  const photosUrl = `${baseUrl}/business/dashboard/settings/photos`;

  const ownerName = (input.ownerName ?? "").trim() || "there";
  const businessName =
    (input.businessName ?? "").trim() || "your business";
  const expiringCount = Math.max(0, Math.floor(input.expiringCount ?? 0));
  const photosLabel = expiringCount === 1 ? "photo" : "photos";
  const countPhrase =
    expiringCount > 0
      ? `${expiringCount} ${photosLabel}`
      : `your ${photosLabel}`;
  const removalLabel = formatEarliestRemovalAt(input.earliestRemovalAtIso);

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
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">Your photos will be removed in 24 hours</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(ownerName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            We&apos;re writing to let you know that <strong>${escapeHtml(countPhrase)}</strong> on the <strong>${escapeHtml(businessName)}</strong> profile will be removed starting <strong>${escapeHtml(removalLabel)}</strong>.
          </td></tr>
          <tr><td style="padding-top:12px;">
            <div style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:14px 16px;">
              <div style="font-size:12px;font-weight:600;color:#9A3412;text-transform:uppercase;letter-spacing:0.04em;">Free plan retention policy</div>
              <div style="margin-top:6px;font-size:15px;line-height:1.5;color:#7C2D12;">
                Photos uploaded on the free plan are automatically removed after 30 calendar days. Upgrading to any paid plan keeps your photos live and unlocks more upload slots.
              </div>
            </div>
          </td></tr>
          <tr><td style="padding-top:20px;font-size:15px;line-height:1.6;color:#404040;">
            To keep these ${escapeHtml(photosLabel)} on your public page, upgrade before the cutoff. If you stay on the free plan, you can always re-upload a fresh set after the 30-day window rolls over.
          </td></tr>
          <tr><td style="padding-top:24px;">
            <a href="${upgradeUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9999px;">Upgrade &amp; keep my photos</a>
          </td></tr>
          <tr><td style="padding-top:18px;font-size:14px;line-height:1.6;color:#606060;">
            Want to review what&apos;s about to be removed? <a href="${photosUrl}" style="color:#1FAF9E;">Open your photo manager</a>.
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            Questions? Reply to this email or reach us at
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
    `This is a heads-up that ${countPhrase} on the ${businessName} profile will be removed starting ${removalLabel}.`,
    "",
    "Free plan retention policy: photos uploaded on the free plan are automatically removed after 30 calendar days. Upgrading to any paid plan keeps your photos live and unlocks more upload slots.",
    "",
    `Upgrade & keep your photos: ${upgradeUrl}`,
    `Open your photo manager: ${photosUrl}`,
    "",
    `Questions? Email ${SUPPORT_EMAIL}.`,
  ].join("\n");

  try {
    const send = await resend.emails.send({
      from,
      to: email,
      subject: "Your photos will be removed in 24 hours, upgrade to keep them",
      html,
      text,
    });
    if (send.error) {
      console.error("[businessPhotoExpiryEmail] send failed:", send.error);
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
    const id =
      typeof send.data?.id === "string" ? send.data.id : undefined;
    return { status: "sent", id };
  } catch (e) {
    console.error("[businessPhotoExpiryEmail] send exception:", e);
    return {
      status: "failed",
      error: e instanceof Error ? e.message : "Email send exception",
    };
  }
}
