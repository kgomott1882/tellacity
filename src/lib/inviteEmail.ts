/**
 * Shared invite email renderer.
 * Used by both the send endpoint (immediate) and the cron worker (scheduled).
 */

import {
  buildInviteBodyInlineStyle,
  buildSubjectLeadInlineStyle,
  parseGrowMessageStyle,
  type GrowMessageStyle,
} from "@/lib/reviewInviteGrowStyle";

export type InviteEmailParams = {
  businessName: string;
  inviteLink: string;
  customSubject?: string | null;
  customMessage?: string | null;
  customSignature?: string | null;
  legalFooterEnabled?: boolean;
  signatureBlock?: string; // pre-rendered HTML from template (premium/elite)
  isReminder?: boolean;
  layoutStyle?: "standard" | "rating_widget" | string | null;
  /** Optional Grow-tier body styling (subject line stays plain text in clients). */
  growMessageStyle?: unknown;
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
    layoutStyle = "standard",
    growMessageStyle,
  } = params;

  const trimmedCustomSubject =
    customSubject != null && String(customSubject).trim() ? String(customSubject).trim() : null;

  const bodyParsedStyle: GrowMessageStyle = parseGrowMessageStyle(growMessageStyle);
  const bodyParaStyle = buildInviteBodyInlineStyle(bodyParsedStyle);
  const subjectLeadStyle = buildSubjectLeadInlineStyle(bodyParsedStyle);

  // Subject (SMTP line; most clients ignore HTML styling on the real subject.)
  let subject = trimmedCustomSubject || DEFAULT_SUBJECT;
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

  // Body text + optional styled headline inside HTML (matches dashboard “subject” appearance).
  const rawMessage = customMessage?.trim() || DEFAULT_MESSAGE;
  const bodyInner = esc(rawMessage).replace(/\n/g, "<br/>");
  const subjectLeadHtml = trimmedCustomSubject
    ? `<p style="${subjectLeadStyle}">${esc(trimmedCustomSubject)}</p>`
    : "";

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

  const ratingWidgetHtml = (() => {
    const starColors = ["#F04438", "#F79009", "#FEC84B", "#84CC16", "#12B76A"];
    const safeInviteLink = esc(inviteLink);
    const stars = starColors
      .map((color, index) => {
        const rating = index + 1;
        const href = `${safeInviteLink}&rating=${rating}`;
        return `
          <td align="center" valign="middle" style="padding:0 4px;">
            <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block; width:38px; height:38px; line-height:38px; text-align:center; text-decoration:none; background:${color}; border-radius:4px; border:1px solid ${color}; color:#ffffff; font-size:22px; font-weight:700;">★</a>
          </td>
        `.trim();
      })
      .join("");

    return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td align="center" style="font-size:18px; font-weight:700; color:#111827; padding-bottom:12px;">
              How did we do?
            </td>
          </tr>
          <tr>
            ${stars}
          </tr>
          <tr>
            <td colspan="5" align="center" style="padding-top:14px; font-size:12px; color:#6b7280;">
              <a href="${safeInviteLink}" target="_blank" rel="noopener noreferrer" style="color:#0E4E45; text-decoration:underline;">
                Click here if the buttons don’t work
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`.trim();
  })();

  const defaultCtaHtml = `
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
`.trim();

  const ctaHtml = layoutStyle === "rating_widget" ? ratingWidgetHtml : defaultCtaHtml;

  const html = `
<div style="font-family:Arial, sans-serif; font-size:14px; color:#222; max-width:600px;">
  ${subjectLeadHtml}
  <p style="${bodyParaStyle}">${bodyInner}</p>

  ${ctaHtml}

  ${sigHtml}
  ${signatureBlock}
  ${legalHtml}
</div>
`.trim();

  return { subject, html };
}
