export const COOKIE_CONSENT_KEY = "tellacity_cookie_consent";
export const COOKIE_CONSENT_HTTP_NAME = "tellacity_consent_v1";

/** One year, matching cookie policy copy. */
export const COOKIE_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
export const COOKIE_CONSENT_MAX_AGE_SEC = 365 * 24 * 60 * 60;

export const COOKIE_CONSENT_UPDATED_EVENT = "tellacity-cookie-consent-updated";
export const COOKIE_CONSENT_OPEN_EVENT = "tellacity-cookie-consent-open";

export type CookieConsentPreferences = {
  required: true;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  savedAt: string;
};

export type CookieConsentInput = {
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
};

function defaultPreferences(
  overrides: Partial<CookieConsentInput> = {},
): CookieConsentPreferences {
  return {
    required: true,
    analytics: overrides.analytics ?? true,
    functional: overrides.functional ?? true,
    marketing: overrides.marketing ?? false,
    savedAt: new Date().toISOString(),
  };
}

function isExpired(savedAt: string): boolean {
  const savedMs = new Date(savedAt).getTime();
  if (Number.isNaN(savedMs)) return true;
  return Date.now() - savedMs > COOKIE_CONSENT_MAX_AGE_MS;
}

function parseJsonConsent(raw: string): CookieConsentPreferences | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentPreferences>;
    if (typeof parsed.savedAt !== "string") return null;
    if (isExpired(parsed.savedAt)) return null;
    return {
      required: true,
      analytics: parsed.analytics === true,
      functional: parsed.functional === true,
      marketing: parsed.marketing === true,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

function writeConsentHttpCookie(preferences: CookieConsentPreferences): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_CONSENT_HTTP_NAME}=${encodeURIComponent(
    JSON.stringify(preferences),
  )}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SEC}; SameSite=Lax`;
}

function clearConsentHttpCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_CONSENT_HTTP_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

/** Google Consent Mode v2 — keeps ads/analytics aligned with banner choices. */
export function applyGoogleConsentMode(preferences: CookieConsentPreferences | null): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const granted = preferences != null;
  const analytics = preferences?.analytics === true;
  const marketing = preferences?.marketing === true;

  window.gtag("consent", granted ? "update" : "default", {
    analytics_storage: analytics ? "granted" : "denied",
    ad_storage: marketing ? "granted" : "denied",
    ad_user_data: marketing ? "granted" : "denied",
    ad_personalization: marketing ? "granted" : "denied",
  });
}

function migrateLegacyConsent(raw: string): CookieConsentPreferences | null {
  if (raw === "accepted") {
    return saveCookieConsent({
      analytics: true,
      functional: true,
      marketing: true,
    });
  }
  if (raw === "custom") {
    return saveCookieConsent({
      analytics: false,
      functional: false,
      marketing: false,
    });
  }
  return null;
}

export function getCookieConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!raw) return null;

  const json = parseJsonConsent(raw);
  if (json) {
    writeConsentHttpCookie(json);
    return json;
  }

  const legacy = migrateLegacyConsent(raw);
  if (legacy) return legacy;

  window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  return null;
}

export function hasValidCookieConsent(): boolean {
  return getCookieConsent() !== null;
}

export function saveCookieConsent(
  input: CookieConsentInput,
): CookieConsentPreferences {
  const preferences = defaultPreferences(input);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    writeConsentHttpCookie(preferences);
    applyGoogleConsentMode(preferences);
    window.dispatchEvent(new Event(COOKIE_CONSENT_UPDATED_EVENT));
  }
  return preferences;
}

export function acceptAllCookieConsent(): CookieConsentPreferences {
  return saveCookieConsent({
    analytics: true,
    functional: true,
    marketing: true,
  });
}

export function rejectNonEssentialCookieConsent(): CookieConsentPreferences {
  return saveCookieConsent({
    analytics: false,
    functional: false,
    marketing: false,
  });
}

export function clearCookieConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  clearConsentHttpCookie();
  applyGoogleConsentMode(null);
  window.dispatchEvent(new Event(COOKIE_CONSENT_UPDATED_EVENT));
}

export function openCookieConsentManager(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_EVENT));
}

export function getGoogleAnalyticsMeasurementId(): string {
  return (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "").trim();
}

export function getMetaPixelId(): string {
  return (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();
}

export function getGoogleAdsId(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "").trim();
}

export function hasFunctionalConsent(): boolean {
  return getCookieConsent()?.functional === true;
}

export function hasMarketingConsent(): boolean {
  return getCookieConsent()?.marketing === true;
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent()?.analytics === true;
}
