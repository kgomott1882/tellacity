import type { Metadata } from "next";
import HowWorksClient from "./HowWorksClient";

const PAGE_URL = "https://tellacity.com/how-tellacity-works";

export const metadata: Metadata = {
  title: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
  description:
    "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
    description:
      "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
    description:
      "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
  },
  robots: { index: true, follow: true },
};

const howItWorksJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
  description:
    "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
  url: PAGE_URL,
  inLanguage: "en",
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
        name: "How Tellacity Works",
        item: PAGE_URL,
      },
    ],
  },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use Tellacity to write and discover trustworthy reviews",
  description:
    "The six-step Tellacity flow that connects search, reviews, verification, business response, and community impact.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Search for businesses",
      text: "Search Tellacity for businesses in any category and country, and view their verified reviews and Trust Score before deciding.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Read Reviews",
      text: "Read verified, moderated customer reviews to learn what real customers actually experienced.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Write a Review",
      text: "Share an honest review with rating, title, and details, optionally attaching proof of purchase.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Review Verification",
      text: "Tellacity verifies reviews against identity signals, proof of purchase, fraud detection, and manual moderation.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Business Collaboration",
      text: "Businesses claim their profile and respond publicly to reviews, resolving issues in the open.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Community Impact",
      text: "Verified reviews update the Trust Score and feed back into search, helping the next customer choose with confidence.",
    },
  ],
};

export default function HowTellacityWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <HowWorksClient />
    </>
  );
}
