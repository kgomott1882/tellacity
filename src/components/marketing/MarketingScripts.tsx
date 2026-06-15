"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  getCookieConsent,
  getGoogleAdsId,
  getMetaPixelId,
} from "@/lib/cookieConsent";

export default function MarketingScripts() {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");
  const metaPixelId = getMetaPixelId();
  const googleAdsId = getGoogleAdsId();
  const [allowMarketing, setAllowMarketing] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const consent = getCookieConsent();
      setAllowMarketing(consent?.marketing === true);
    };

    refresh();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, refresh);
  }, []);

  useEffect(() => {
    if (!allowMarketing || isWidgetRoute || typeof window === "undefined") return;
    if (typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
    if (typeof window.gtag === "function" && googleAdsId) {
      window.gtag("event", "page_view", {
        send_to: googleAdsId,
      });
    }
  }, [allowMarketing, isWidgetRoute, pathname, googleAdsId]);

  if (isWidgetRoute || !allowMarketing) return null;

  return (
    <>
      {metaPixelId ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {googleAdsId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-ads-tag" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAdsId}');`}
          </Script>
        </>
      ) : null}
    </>
  );
}
