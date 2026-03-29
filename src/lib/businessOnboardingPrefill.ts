import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";

const SIGNUP_BUSINESS_KEY = "signup_business";

export type OnboardingPrefillPayload = {
  businessName: string;
  websiteHost: string;
  countryCode: string;
  phone: string;
  publicEmail: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
};

export function readSignupBusinessSessionStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(SIGNUP_BUSINESS_KEY);
  } catch {
    return null;
  }
}

export function parseSignupBusinessSession(
  raw: string | null
): Partial<Pick<OnboardingPrefillPayload, "businessName" | "websiteHost" | "countryCode">> {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as {
      business_name?: string;
      website?: string;
      country?: string;
    };
    return {
      businessName:
        typeof o.business_name === "string" ? o.business_name.trim() : "",
      websiteHost: o.website ? normalizeWebsiteDomain(o.website) : "",
      countryCode:
        typeof o.country === "string"
          ? o.country.trim().toUpperCase().slice(0, 2)
          : "",
    };
  } catch {
    return {};
  }
}

export type AccountApiOnboarding = {
  businessName?: string;
  websiteHost?: string;
  countryCode?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  workEmail?: string;
};

/**
 * Combines server account onboarding hints, signup OTP sessionStorage, and email-domain fallback.
 */
export function mergeOnboardingPrefill(
  onboarding: AccountApiOnboarding | null | undefined,
  sessionRaw: string | null,
  fallbackEmail: string
): OnboardingPrefillPayload {
  const sessionPart = parseSignupBusinessSession(sessionRaw);
  const o = onboarding ?? {};
  const emailNorm = fallbackEmail.trim().toLowerCase();
  const emailDomainHost = emailNorm.includes("@")
    ? normalizeWebsiteDomain(emailNorm.split("@")[1] ?? "")
    : "";

  const workEmail = (o.workEmail || emailNorm || "").trim().toLowerCase();

  return {
    businessName: (o.businessName || sessionPart.businessName || "").trim(),
    websiteHost: (
      o.websiteHost ||
      sessionPart.websiteHost ||
      emailDomainHost ||
      ""
    ).trim(),
    countryCode: (o.countryCode || sessionPart.countryCode || "")
      .trim()
      .toUpperCase()
      .slice(0, 2),
    phone: (o.phone || "").trim(),
    publicEmail: workEmail,
    firstName: (o.firstName || "").trim(),
    lastName: (o.lastName || "").trim(),
    jobTitle: (o.jobTitle || "").trim(),
  };
}
