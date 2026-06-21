import { Resend } from "resend";
import { resendFromHeader } from "@/lib/businessDomainVerification";
import { getPublicAppOrigin } from "@/lib/emailBranding";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AdminManualClaimPasswordSetupEmailParams = {
  to: string;
  ownerFirstName: string;
  businessName: string;
  /** When true, copy says "create your password"; otherwise "set a new password". */
  isNewAccount: boolean;
  siteUrl?: string;
};

/**
 * Sends the owner a password-setup email after an admin manually creates/claims
 * their business. Uses the locked `/business/forgot-password` OTP flow, not
 * Supabase link-based reset.
 */
export async function sendAdminManualClaimPasswordSetupEmail(
  params: AdminManualClaimPasswordSetupEmailParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const email = params.to.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid recipient email." };
  }

  const base = (params.siteUrl ?? getPublicAppOrigin()).replace(/\/$/, "");
  const setupUrl = new URL("/business/forgot-password", base);
  setupUrl.searchParams.set("email", email);
  setupUrl.searchParams.set("from", "admin-claim");

  const biz = esc(params.businessName.trim() || "your business");
  const greetingName = esc(params.ownerFirstName.trim() || "there");
  const setupHref = esc(setupUrl.toString());

  const subject = params.isNewAccount
    ? `Create your password for ${params.businessName.trim() || "your business"} on Tellacity`
    : `Your Tellacity business account for ${params.businessName.trim() || "your business"}`;

  const lead = params.isNewAccount
    ? `Your Tellacity business account for <strong>${biz}</strong> is ready. Before you can sign in to your dashboard, you need to <strong>create a password</strong>.`
    : `<strong>${biz}</strong> has been assigned to your Tellacity account. To sign in, use your existing password, or set a new one using the link below if you prefer.`;

  const ctaLabel = params.isNewAccount ? "Create your password" : "Set your password";

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222;max-width:600px;">
  <p>Hi ${greetingName},</p>
  <p>${lead}</p>
  <p>Click the button below to choose a password. We will email you a 6-digit code to confirm it is you.</p>
  <div style="margin:24px 0;">
    <a href="${setupHref}"
       style="display:inline-block;padding:12px 20px;background:#0E4E45;color:#fff;
              text-decoration:none;border-radius:6px;font-weight:600;">
      ${esc(ctaLabel)}
    </a>
  </div>
  <p style="font-size:12px;color:#777;">
    If the button does not work, copy and paste this link into your browser:<br/>
    <a href="${setupHref}" style="color:#0E4E45;word-break:break-all;">${setupHref}</a>
  </p>
  <p style="font-size:11px;color:#aaa;margin-top:24px;">
    If you did not expect this message, you can safely ignore it.
  </p>
</div>`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: resendFromHeader(),
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("[sendAdminManualClaimPasswordSetupEmail] Resend:", error);
    return { ok: false, error: error.message ?? "Failed to send email." };
  }

  return { ok: true };
}
