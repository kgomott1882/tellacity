import { Resend } from "resend";
import { resendFromHeader } from "@/lib/businessDomainVerification";

export async function sendBusinessSuggestionOtpEmail(
  toEmail: string,
  code: string,
  businessName: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: resendFromHeader(),
    to: toEmail,
    subject: "Verify your business suggestion on Tellacity",
    html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif">
<p>You asked to list <strong>${escapeHtml(businessName)}</strong> on Tellacity.</p>
<p>Your verification code is: <strong style="letter-spacing:4px;font-size:1.25rem">${escapeHtml(code)}</strong></p>
<p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
</body></html>`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
