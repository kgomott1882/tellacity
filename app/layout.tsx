import "./globals.css";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import AbortErrorHandler from "@/components/AbortErrorHandler";
import ConsentModeBootstrap from "@/components/common/ConsentModeBootstrap";
import CookieBar from "@/components/CookieBar";
import AnalyticsGate from "@/components/common/AnalyticsGate";
import MarketingGate from "@/components/common/MarketingGate";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import VisitTracker from "@/components/common/VisitTracker";
import CountrySync from "@/components/common/CountrySync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  metadataBase: new URL("https://tellacity.com"),
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const abortErrorHandlerScript = `
  (function() {
    function suppress(e) {
      if (!e || !e.reason) return;
      var r = e.reason;
      if (r && typeof r === 'object') {
        var name = r.name || (r.constructor && r.constructor.name);
        var msg = typeof r.message === 'string' ? r.message : '';
        if (name === 'AbortError' || msg.toLowerCase().indexOf('abort') !== -1 || msg === 'signal is aborted without reason' || msg.indexOf('Lock broken') !== -1 || msg.indexOf('steal') !== -1) {
          e.preventDefault();
          e.stopPropagation();
          return true;
        }
      }
      return false;
    }
    window.addEventListener('unhandledrejection', suppress, true);
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <ConsentModeBootstrap />
        <script dangerouslySetInnerHTML={{ __html: abortErrorHandlerScript }} />
        <AbortErrorHandler />
        <CountrySync />
        <Suspense fallback={null}>
          <ConditionalNavbar />
        </Suspense>
        <main>{children}</main>
        <Suspense fallback={null}>
          <ConditionalFooter />
        </Suspense>
        <CookieBar />
        <VisitTracker />
        <AnalyticsGate />
        <MarketingGate>
          <MarketingScripts />
        </MarketingGate>
      </body>
    </html>
  );
}
