import type { Metadata } from "next";
import ForBusinessClient from "./ForBusinessClient";
import { FAQ_ITEMS } from "./forBusinessData";

const PAGE_URL = "https://tellacity.com/for-business";

export const metadata: Metadata = {
  title: "Tellacity for Business | Reputation Platform & Reviews",
  description:
    "Collect verified reviews, manage reputation, embed widgets, publish blogs and case studies, and grow trust, all in one Tellacity dashboard for businesses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Tellacity for Business | Reputation Platform & Reviews",
    description:
      "Collect verified reviews, manage reputation, embed widgets, publish blogs and case studies, and grow trust, all in one Tellacity dashboard for businesses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tellacity for Business | Reputation Platform & Reviews",
    description:
      "Collect verified reviews, manage reputation, embed widgets, publish blogs and case studies, and grow trust, all in one Tellacity dashboard for businesses.",
  },
  robots: { index: true, follow: true },
};

const forBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Tellacity for Business | Reputation Platform & Reviews",
  description:
    "Collect verified reviews, manage reputation, embed widgets, publish blogs and case studies, and grow trust, all in one Tellacity dashboard for businesses.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://tellacity.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tellacity for Business",
        item: PAGE_URL,
      },
    ],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function ForBusinessPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(forBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ForBusinessClient />
    </>
  );
}
