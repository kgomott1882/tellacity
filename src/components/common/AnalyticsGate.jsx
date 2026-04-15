"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export default function AnalyticsGate() {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");
  let allowAnalytics = false;
  if (!isWidgetRoute && typeof window !== "undefined") {
    const consent = localStorage.getItem("tellacity_cookie_consent");
    if (consent) {
      try {
        const parsed = JSON.parse(consent);
        allowAnalytics = parsed.analytics === true;
      } catch {
        allowAnalytics = false;
      }
    }
  }

  if (isWidgetRoute || !allowAnalytics) return null;

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-XXXXXXXXXX');`}
      </Script>
    </>
  );
}
