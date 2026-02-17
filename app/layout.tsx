import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import AbortErrorHandler from "@/components/AbortErrorHandler";
import CookieConsentModal from "@/components/common/CookieConsentModal";
import AnalyticsGate from "@/components/common/AnalyticsGate";

export const metadata = {
  icons: {
    icon: "/favicon.ico",
  },
};

const abortErrorHandlerScript = `
  window.addEventListener('unhandledrejection', function(e) {
    if (e && e.reason != null && typeof e.reason === 'object' && e.reason.name === 'AbortError') {
      e.preventDefault();
    }
  });
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: abortErrorHandlerScript }} />
        <AbortErrorHandler />
        <ConditionalNavbar />
        <main>{children}</main>
        <ConditionalFooter />
        <CookieConsentModal />
        <AnalyticsGate />
      </body>
    </html>
  );
}
