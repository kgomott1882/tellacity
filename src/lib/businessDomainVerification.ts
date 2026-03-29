import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";

export { normalizeWebsiteDomain };

/** Same as {@link normalizeWebsiteDomain}. */
export function normalizeWebsiteHost(website: string): string {
  return normalizeWebsiteDomain(website);
}

/** True when the email's domain matches the business website host (or subdomain). */
export function sessionEmailDomainMatchesBusinessWebsite(
  sessionEmail: string,
  businessWebsite: string | null | undefined
): boolean {
  const emailNorm = sessionEmail.trim().toLowerCase();
  const at = emailNorm.indexOf("@");
  if (at < 1) return false;
  const emailDomain = normalizeWebsiteDomain(emailNorm.slice(at + 1));
  const siteDomain = normalizeWebsiteDomain(String(businessWebsite ?? ""));
  if (!emailDomain || !siteDomain) return false;
  if (emailDomain === siteDomain) return true;
  return siteDomain.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${siteDomain}`);
}

export function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}
