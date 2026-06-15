"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getCookieConsent,
  getGoogleAnalyticsMeasurementId,
  applyGoogleConsentMode,
} from "@/lib/cookieConsent";

export default function AnalyticsGate() {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");
  const gaId = getGoogleAnalyticsMeasurementId();
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const consent = getCookieConsent();
      applyGoogleConsentMode(consent);
      setAllowAnalytics(consent?.analytics === true);
    };

    refresh();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
    return () =>
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
  }, []);

  if (isWidgetRoute || !allowAnalytics || !gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { anonymize_ip: true });`}
      </Script>
    </>
  );
}
