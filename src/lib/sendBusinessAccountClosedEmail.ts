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

export type BusinessAccountClosedEmailParams = {
  to: string;
  ownerName?: string;
  businessNames?: string[];
};

export async function sendBusinessAccountClosedEmail(
  params: BusinessAccountClosedEmailParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const email = params.to.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Invalid recipient email." };
  }

  const greetingName = esc(params.ownerName?.trim() || "there");
  const businessNames = (params.businessNames ?? [])
    .map((n) => n.trim())
    .filter(Boolean);
  const listingsBlock =
    businessNames.length > 0
      ? `<p>The following business listing${businessNames.length === 1 ? "" : "s"} on Tellacity ${businessNames.length === 1 ? "was" : "were"} permanently removed:</p>
<ul style="margin:12px 0;padding-left:20px;">
${businessNames.map((n) => `<li>${esc(n)}</li>`).join("\n")}
</ul>`
      : `<p>Any business listings linked to your account on Tellacity have been permanently removed.</p>`;

  const siteUrl = esc(getPublicAppOrigin().replace(/\/$/, ""));

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222;max-width:600px;">
  <p>Hi ${greetingName},</p>
  <p>This confirms that your <strong>Tellacity Business account</strong> has been closed and you no longer have access to the business dashboard.</p>
  ${listingsBlock}
  <p>Associated reviews and dashboard data for those listings have also been removed. This action cannot be undone.</p>
  <p>If you did not request this closure, please contact us immediately at
    <a href="mailto:support@tellacity.com" style="color:#0E4E45;">support@tellacity.com</a>.
  </p>
  <p style="font-size:12px;color:#777;margin-top:24px;">
  Tellacity · <a href="${siteUrl}" style="color:#0E4E45;">${siteUrl}</a>
  </p>
</div>`.trim();

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: resendFromHeader(),
    to: [email],
    subject: "Your Tellacity Business account has been closed",
    html,
  });

  if (error) {
    console.error("[sendBusinessAccountClosedEmail] Resend:", error);
    return { ok: false, error: error.message ?? "Failed to send email." };
  }

  return { ok: true };
}
