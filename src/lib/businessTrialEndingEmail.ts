import { Resend } from "resend";
import { billingCheckoutPickerPath } from "@/lib/billingCheckoutPaths";
import { formatPaidPlanMonthlyUsd } from "@/lib/billingPlanConfirm";
import { getPublicAppOrigin } from "@/lib/emailBranding";
import { resendFromHeader } from "@/lib/businessDomainVerification";

const SUPPORT_EMAIL = "sales@tellacity.com";
const BILLING_RETURN_TO = "/business/dashboard/billing";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTrialEndDate(iso: string | null | undefined): string | null {
  const trimmed = (iso ?? "").trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export type TrialEndingEmailInput = {
  toEmail: string;
  ownerName?: string | null;
  businessName?: string | null;
  /** ISO timestamp for trial end (`subscriptions.current_period_end`). */
  trialEndIso?: string | null;
};

export type TrialEndingEmailResult =
  | { status: "sent"; messageId?: string }
  | { status: "skipped" }
  | { status: "failed"; error: string };

export async function sendTrialEndingEmail(
  input: TrialEndingEmailInput,
): Promise<TrialEndingEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[businessTrialEndingEmail] RESEND_API_KEY missing; skipping email.",
    );
    return { status: "skipped" };
  }

  const email = input.toEmail.trim().toLowerCase();
  if (!email) return { status: "skipped" };

  const origin = getPublicAppOrigin();
  const checkoutPath = billingCheckoutPickerPath("grow", "monthly", BILLING_RETURN_TO);
  const checkoutUrl = `${origin}${checkoutPath}`;
  const billingUrl = `${origin}${BILLING_RETURN_TO}`;
  const preferencesUrl = `${origin}/business/dashboard/settings/notifications`;

  const ownerName = (input.ownerName ?? "").trim() || "there";
  const businessName =
    (input.businessName ?? "").trim() || "your business";
  const trialEndLabel = formatTrialEndDate(input.trialEndIso);
  const growMonthlyPrice = formatPaidPlanMonthlyUsd("grow");
  const trialEndPhrase = trialEndLabel
    ? `on <strong>${escapeHtml(trialEndLabel)}</strong>`
    : "in about 3 days";
  const trialEndPhraseText = trialEndLabel
    ? `on ${trialEndLabel}`
    : "in about 3 days";
  const cancelBeforePhrase = trialEndLabel
    ? `before ${trialEndLabel}`
    : "before your trial ends";

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
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">Your Grow trial ends in 3 days</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(ownerName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            Your 14-day Grow trial for <strong>${escapeHtml(businessName)}</strong> ends ${trialEndPhrase}. On that date, your card on file will be charged <strong>${escapeHtml(growMonthlyPrice)}/month</strong> for Grow and your subscription continues automatically.
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            No action is needed to keep Grow. To avoid the charge, cancel ${escapeHtml(cancelBeforePhrase)} from billing.
          </td></tr>
          <tr><td style="padding-top:24px;">
            <a href="${checkoutUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:9999px;">Keep Grow</a>
          </td></tr>
          <tr><td style="padding-top:18px;font-size:14px;line-height:1.6;color:#606060;">
            Manage billing or cancel: <a href="${billingUrl}" style="color:#1FAF9E;">${escapeHtml(billingUrl)}</a>
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
    `Your 14-day Grow trial for ${businessName} ends ${trialEndPhraseText}.`,
    "",
    `On that date, your card on file will be charged ${growMonthlyPrice}/month for Grow and your subscription continues automatically.`,
    "",
    `No action is needed to keep Grow. To avoid the charge, cancel ${cancelBeforePhrase} from billing:`,
    billingUrl,
    "",
    `Keep Grow: ${checkoutUrl}`,
    "",
    `Questions? Email ${SUPPORT_EMAIL}.`,
    "",
    `Manage email preferences: ${preferencesUrl}`,
  ].join("\n");

  try {
    const send = await resend.emails.send({
      from,
      to: email,
      subject: "Your Grow trial ends in 3 days — card charge coming",
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${preferencesUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (send.error) {
      console.error("[businessTrialEndingEmail] send failed:", send.error);
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
    console.error("[businessTrialEndingEmail] send exception:", e);
    return {
      status: "failed",
      error: e instanceof Error ? e.message : "Email send exception",
    };
  }
}
