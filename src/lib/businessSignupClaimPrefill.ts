import { normalizeSignupWebsiteInput } from "@/lib/extractDomain";

/** Values encoded on `/business/signup` when claiming from a public profile or claim search. */
export type BusinessSignupClaimPrefill = {
  businessId: string;
  businessName: string;
  businessSlug?: string | null;
  /** Host or URL from the directory row; normalized to `https://host` in the query string. */
  website?: string | null;
};

/**
 * Builds `/business/signup?...` with stable query keys consumed by
 * {@link app/business/signup/BusinessSignupClient.tsx} on first load.
 */
export function buildBusinessSignupClaimPrefillUrl(
  input: BusinessSignupClaimPrefill
): string {
  const businessId = String(input.businessId ?? "").trim();
  const businessName = String(input.businessName ?? "").trim();
  if (!businessId || !businessName) {
    return "/business/signup";
  }

  const params = new URLSearchParams();
  params.set("businessId", businessId);
  params.set("businessName", businessName);

  const slug = String(input.businessSlug ?? "").trim();
  if (slug) params.set("businessSlug", slug);

  const rawSite = String(input.website ?? "").trim();
  if (rawSite) {
    const normalized = normalizeSignupWebsiteInput(rawSite);
    if (normalized) params.set("website", normalized);
  }

  return `/business/signup?${params.toString()}`;
}
