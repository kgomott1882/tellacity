/**
 * Shared invite email renderer.
 * Used by both the send endpoint (immediate) and the cron worker (scheduled).
 */

export type InviteEmailParams = {
  businessName: string;
  inviteLink: string;
  customSubject?: string | null;
  customMessage?: string | null;
  customSignature?: string | null;
  legalFooterEnabled?: boolean;
  signatureBlock?: string; // pre-rendered HTML from template (premium/elite)
  isReminder?: boolean;
};

const DEFAULT_SUBJECT = "You're invited to leave a review";
const DEFAULT_MESSAGE =
  "You've been invited to leave a review.\n\nClick the link in this email to leave your review. If the button doesn't work, copy and paste the link into your browser.";

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInviteEmail(params: InviteEmailParams): {
  subject: string;
  html: string;
} {
  const {
    businessName,
    inviteLink,
    customSubject,
    customMessage,
    customSignature,
    legalFooterEnabled,
    signatureBlock = "",
    isReminder = false,
  } = params;

  // Subject
  let subject = customSubject?.trim() || DEFAULT_SUBJECT;
  if (businessName?.trim()) {
    const norm = subject.toLowerCase();
    const biz = businessName.trim().toLowerCase();
    if (!norm.includes(biz)) {
      subject = `${subject} - ${businessName.trim()}`;
    }
  }
  if (isReminder) {
    subject = `Reminder: ${subject}`;
  }

  // Body text
  const rawMessage = customMessage?.trim() || DEFAULT_MESSAGE;
  const bodyHtml = esc(rawMessage).replace(/\n/g, "<br/>");

  // Signature line (plain text fallback when no premium template block)
  const sigLine = customSignature?.trim() || businessName?.trim() || "";
  const sigHtml =
    !signatureBlock && sigLine
      ? `<p style="margin-top:24px; font-size:13px; color:#555;">${esc(sigLine)}</p>`
      : "";

  // Legal footer
  const legalHtml = legalFooterEnabled
    ? `<p style="margin-top:24px; font-size:11px; color:#999; border-top:1px solid #eee; padding-top:12px;">
        You received this email because ${esc(businessName)} invited you to share your experience.
        If you did not make a purchase or do not wish to leave a review, you can safely ignore this email.
      </p>`
    : "";

  const html = `
<div style="font-family:Arial, sans-serif; font-size:14px; color:#222; max-width:600px;">
  <p>${bodyHtml}</p>

  <div style="margin:24px 0;">
    <a href="${esc(inviteLink)}" target="_blank" rel="noopener noreferrer"
       style="display:inline-block; padding:12px 20px; background:#0E4E45; color:#fff;
              text-decoration:none; border-radius:6px; font-weight:600;">
      Leave a review
    </a>
  </div>

  <p style="font-size:12px; color:#777;">
    If the button does not work, copy and paste this link into your browser:<br/>
    <a href="${esc(inviteLink)}" style="color:#0E4E45; word-break:break-all;">${esc(inviteLink)}</a>
  </p>

  ${sigHtml}
  ${signatureBlock}
  ${legalHtml}
</div>
`.trim();

  return { subject, html };
}
