import type { Metadata } from "next";
import ReputationManagementClient from "./ReputationManagementClient";
import { WORKFLOW } from "./reputationManagementData";

export const metadata: Metadata = {
  title: "Reputation Management for Verified Customer Trust | Tellacity",
  description:
    "Manage customer trust from one centralised reputation operations dashboard. Respond to reviews, handle disputes, monitor abuse, and protect your verified profile with Tellacity. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/reputation-management",
  },
  openGraph: {
    title: "Reputation Management for Verified Customer Trust | Tellacity",
    description:
      "Manage customer trust from one centralised reputation operations dashboard. Respond to reviews, handle disputes, monitor abuse, and protect your verified profile with Tellacity.",
    url: "https://tellacity.com/solutions/reputation-management",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reputation Management for Verified Customer Trust | Tellacity",
    description:
      "Centralised reputation operations. Public replies, disputes, moderation, fraud detection, verified profiles, and audit logs in one dashboard.",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Reputation Management",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Respond to reviews, handle disputes, monitor fraud, and maintain verified business profiles from one centralised reputation management dashboard.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/reputation-management",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://tellacity.com/business/signup",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
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
      name: "Solutions",
      item: "https://tellacity.com/solutions",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Reputation Management",
      item: "https://tellacity.com/solutions/reputation-management",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity Reputation Management turns reviews into structured trust operations",
  description:
    "Tellacity Reputation Management processes every customer interaction through a six-stage operational lifecycle so replies, disputes, moderation, and profile updates stay consistent and auditable.",
  totalTime: "PT5M",
  step: WORKFLOW.steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.description,
  })),
};

export default function ReputationManagementSolutionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <ReputationManagementClient />
    </>
  );
}
