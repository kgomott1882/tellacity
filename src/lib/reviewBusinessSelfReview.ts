import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";

/** Never treat these public-mail domains as “the business domain” from contact email alone. */
const GENERIC_CONSUMER_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "web.de",
  "yandex.com",
  "mail.com",
  "zoho.com",
]);

export const SAME_DOMAIN_REVIEW_MESSAGE =
  "You can’t use a work email for this business. Please leave a review from a personal email address.";

export const SAME_DOMAIN_REVIEW_ERROR_CODE = "same_domain_as_business" as const;

export function isGenericConsumerEmailDomain(domain: string): boolean {
  return GENERIC_CONSUMER_EMAIL_DOMAINS.has(domain.trim().toLowerCase());
}

export function extractEmailDomain(emailLower: string): string | null {
  const e = emailLower.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1 || at === e.length - 1) return null;
  return e.slice(at + 1).trim() || null;
}

/** True if `candidate` is exactly `org` or a subdomain of it (e.g. mail.acme.com under acme.com). */
export function domainIsUnderOrgDomain(orgDomain: string, candidateDomain: string): boolean {
  const o = orgDomain.trim().toLowerCase();
  const c = candidateDomain.trim().toLowerCase();
  if (!o || !c) return false;
  if (c === o) return true;
  return c.endsWith("." + o);
}

/**
 * Domains that count as “the business” for self-review blocking:
 * - Normalized `website` / `website_display` hosts
 * - Domain part of `businesses.email` when it is not a generic consumer provider
 */
export function buildBusinessDomainSet(row: {
  email?: string | null;
  website?: string | null;
  website_display?: string | null;
}): Set<string> {
  const out = new Set<string>();
  const add = (raw: string) => {
    const d = normalizeWebsiteDomain(raw);
    if (d) out.add(d);
  };
  add(String(row.website_display ?? ""));
  add(String(row.website ?? ""));
  const contact = String(row.email ?? "").trim().toLowerCase();
  if (contact.includes("@")) {
    const host = extractEmailDomain(contact);
    if (host && !isGenericConsumerEmailDomain(host)) {
      add(host);
    }
  }
  return out;
}

export function isReviewerBlockedAsBusinessDomain(params: {
  reviewerEmailLower: string;
  businessDomains: Set<string>;
  businessContactEmailLower: string | null;
}): boolean {
  const rev = params.reviewerEmailLower.trim().toLowerCase();
  if (!rev.includes("@")) return false;
  const contact = params.businessContactEmailLower?.trim().toLowerCase() ?? null;
  if (contact && rev === contact) return true;

  const rd = extractEmailDomain(rev);
  if (!rd) return false;

  for (const bd of params.businessDomains) {
    if (!bd) continue;
    if (domainIsUnderOrgDomain(bd, rd)) return true;
  }
  return false;
}

export async function fetchBusinessDomainContext(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ domains: Set<string>; contactEmailLower: string | null }> {
  const { data, error } = await supabase
    .from("businesses")
    .select("email, website, website_display")
    .eq("id", businessId)
    .maybeSingle();

  if (error || !data) {
    return { domains: new Set(), contactEmailLower: null };
  }

  const row = data as {
    email?: string | null;
    website?: string | null;
    website_display?: string | null;
  };
  const contact = String(row.email ?? "").trim().toLowerCase();
  return {
    domains: buildBusinessDomainSet(row),
    contactEmailLower: contact || null,
  };
}
