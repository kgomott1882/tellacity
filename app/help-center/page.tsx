import type { Metadata } from "next";
import { Suspense } from "react";
import HelpCenterContent from "./HelpCenterContent";
import { buildHelpCenterJsonLd } from "@/lib/helpCenterEntries";

const PAGE_URL = "https://tellacity.com/help-center";

export const metadata: Metadata = {
  title: "Help Center | Tellacity",
  description:
    "Find answers about reviews, verification, moderation, business profiles, billing, and Tellacity’s trust and support policies.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Help Center | Tellacity",
    description:
      "Find answers about reviews, verification, moderation, business profiles, billing, and Tellacity’s trust and support policies.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Help Center | Tellacity",
    description:
      "Find answers about reviews, verification, moderation, business profiles, billing, and Tellacity’s trust and support policies.",
  },
  robots: { index: true, follow: true },
};

const jsonLdScripts = buildHelpCenterJsonLd();

export default function HelpCenterPage() {
  return (
    <>
      {jsonLdScripts.map((schema, index) => (
        <script
          key={`help-center-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Suspense fallback={null}>
        <HelpCenterContent />
      </Suspense>
    </>
  );
}
