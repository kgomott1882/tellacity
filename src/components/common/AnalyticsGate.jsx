"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function AnalyticsGate() {
  const [allowAnalytics, setAllowAnalytics] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("tellacity_cookie_consent");
    if (!consent) return;

    try {
      const parsed = JSON.parse(consent);
      if (parsed.analytics === true) {
        setAllowAnalytics(true);
      }
    } catch {}
  }, []);

  if (!allowAnalytics) return null;

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', 'G-XXXXXXXXXX');`}
      </Script>
    </>
  );
}
