export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";
import { Suspense } from "react";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import AbortErrorHandler from "@/components/AbortErrorHandler";
import CookieBar from "@/components/CookieBar";
import AnalyticsGate from "@/components/common/AnalyticsGate";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export const metadata = {
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

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
    <html lang="en">
      <body>
        <ScrollProgress />
        <script dangerouslySetInnerHTML={{ __html: abortErrorHandlerScript }} />
        <AbortErrorHandler />
        <Suspense fallback={null}>
          <ConditionalNavbar />
        </Suspense>
        <main>{children}</main>
        <Suspense fallback={null}>
          <ConditionalFooter />
        </Suspense>
        <CookieBar />
        <AnalyticsGate />
      </body>
    </html>
  );
}
