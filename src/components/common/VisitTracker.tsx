"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  applyGoogleConsentMode,
  getCookieConsent,
  hasValidCookieConsent,
} from "@/lib/cookieConsent";
import {
  captureUtmFromUrl,
  getOrCreateVisitorId,
  recordBusinessProfileView,
  syncFirstPartyCookiesAfterConsent,
} from "@/lib/firstPartyCookies";
import { setStoredCountry } from "@/lib/country";

function businessSlugFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = /^\/b\/([^/]+)\/?$/.exec(pathname);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return match[1].trim().toLowerCase();
  }
}

export default function VisitTracker() {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");

  useEffect(() => {
    if (isWidgetRoute) return;

    const bootstrap = () => {
      const consent = getCookieConsent();
      applyGoogleConsentMode(consent);
      if (!consent) return;

      syncFirstPartyCookiesAfterConsent();

      if (consent.functional) {
        const country = new URLSearchParams(window.location.search).get("country");
        if (country?.trim()) {
          setStoredCountry(country);
        }
      }

      if (consent.marketing) {
        getOrCreateVisitorId();
        captureUtmFromUrl();
      }
    };

    bootstrap();

    const onConsentUpdated = () => {
      bootstrap();
    };

    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onConsentUpdated);
  }, [isWidgetRoute]);

  useEffect(() => {
    if (isWidgetRoute || !hasValidCookieConsent()) return;
    const slug = businessSlugFromPath(pathname);
    if (!slug) return;
    recordBusinessProfileView(slug);
  }, [pathname, isWidgetRoute]);

  return null;
}
