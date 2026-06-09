import type { Metadata } from "next";
import InvestorClient from "./InvestorClient";
import { PAGE_URL, investorRelationsJsonLd } from "./investorData";

export const metadata: Metadata = {
  title: "Investor Relations | Tellacity",
  description:
    "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Investor Relations | Tellacity",
    description:
      "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor Relations | Tellacity",
    description:
      "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
  },
  robots: { index: true, follow: true },
};

export default function InvestorRelationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(investorRelationsJsonLd),
        }}
      />
      <InvestorClient />
    </>
  );
}
