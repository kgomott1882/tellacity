import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Resend } from "resend";

const SALES_NOTIFY_EMAIL = "sales@tellacity.com";

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

/**
 * After domain OTP verification successfully claims or activates a listing: email the owner and notify sales.
 * Does not throw , claim already succeeded in the DB.
 */
export async function sendBusinessClaimSuccessEmails(input: {
  toEmail: string;
  businessName: string;
  fullName: string;
  countryCode?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[businessClaimEmail] RESEND_API_KEY missing; skipping claim emails.",
    );
    return;
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com"
  ).replace(/\/$/, "");
  const dashboardUrl = `${baseUrl}/business/dashboard`;
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
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">Your business is claimed on Tellacity</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            Hi ${escapeHtml(safeName)},
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            You&apos;ve successfully claimed <strong>${escapeHtml(bizName)}</strong>. Your business profile is live and you can manage reviews, widgets, and settings from your dashboard.
          </td></tr>
          ${
            country
              ? `<tr><td style="padding-top:12px;font-size:14px;color:#666;">Country: ${escapeHtml(country)}</td></tr>`
              : ""
          }
          <tr><td style="padding-top:28px;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;">Go to dashboard</a>
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            Questions? Contact us at <a href="mailto:${SALES_NOTIFY_EMAIL}" style="color:#1FAF9E;">${SALES_NOTIFY_EMAIL}</a>.
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
      subject: "Your business is claimed on Tellacity",
      html: userHtml,
    });
    if (userSend.error) {
      console.error(
        "[businessClaimEmail] user send failed:",
        userSend.error,
      );
    }
  } catch (e) {
    console.error("[businessClaimEmail] user send exception:", e);
  }

  const internalText = [
    "Business claimed on Tellacity (domain verification completed).",
    "",
    `Business name: ${input.businessName.trim() || "-"}`,
    `Owner email: ${input.toEmail.trim().toLowerCase()}`,
    `Contact name: ${input.fullName.trim() || "-"}`,
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
      subject: "Business claimed on Tellacity",
      text: internalText,
    });
    if (salesSend.error) {
      console.error(
        "[businessClaimEmail] sales notify failed:",
        salesSend.error,
      );
    }
  } catch (e) {
    console.error("[businessClaimEmail] sales notify exception:", e);
  }
}

/**
 * Load display name + listing from DB; send claim emails. Safe to fire-and-forget after verify-domain success.
 */
export async function notifyBusinessClaimSuccess(
  admin: SupabaseClient,
  user: User,
  businessId: string
): Promise<void> {
  try {
    const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
    if (!email) return;

    const { data: biz } = await admin
      .from("businesses")
      .select("name, country_code")
      .eq("id", businessId)
      .maybeSingle();

    const { data: prof } = await admin
      .from("profiles")
      .select("full_name, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const fromMeta =
      (typeof meta?.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta?.display_name === "string" && meta.display_name.trim()) ||
      "";

    const fromProf =
      (prof?.full_name && String(prof.full_name).trim()) ||
      [prof?.first_name, prof?.last_name].filter(Boolean).join(" ").trim();

    const fullName =
      fromProf ||
      fromMeta ||
      email.split("@")[0] ||
      "there";

    const businessName =
      (biz && typeof (biz as { name?: string }).name === "string" && (biz as { name: string }).name.trim()) ||
      "Your business";

    const countryCode =
      biz && typeof (biz as { country_code?: string }).country_code === "string"
        ? (biz as { country_code: string }).country_code
        : undefined;

    await sendBusinessClaimSuccessEmails({
      toEmail: email,
      businessName,
      fullName,
      countryCode,
    });
  } catch (e) {
    console.error("[notifyBusinessClaimSuccess]", e);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
