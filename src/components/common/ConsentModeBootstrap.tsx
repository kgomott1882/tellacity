import Script from "next/script";

/** Default Google Consent Mode v2 — deny until the user chooses in the banner. */
export default function ConsentModeBootstrap() {
  return (
    <Script id="tellacity-consent-default" strategy="beforeInteractive">
      {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});`}
    </Script>
  );
}
