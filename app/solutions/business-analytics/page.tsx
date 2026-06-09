import type { Metadata } from "next";
import BusinessAnalyticsClient from "./BusinessAnalyticsClient";
import { WORKFLOW } from "./businessAnalyticsData";

export const metadata: Metadata = {
  title: "Business Analytics for Verified Customer Trust | Tellacity",
  description:
    "See exactly what's driving your trust score with Tellacity Business Analytics. Track verified reviews, trust trends, response performance, and customer sentiment from one centralised dashboard. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/business-analytics",
  },
  openGraph: {
    title: "Business Analytics for Verified Customer Trust | Tellacity",
    description:
      "See exactly what's driving your trust score with Tellacity Business Analytics. Track verified reviews, trust trends, response performance, and customer sentiment from one centralised dashboard.",
    url: "https://tellacity.com/solutions/business-analytics",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Analytics for Verified Customer Trust | Tellacity",
    description:
      "Centralised, verified analytics for trust score trends, sentiment, response performance, and multi-location visibility.",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Business Analytics",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Transform verified customer reviews, sentiment, and response activity into centralised trust-score analytics and operational insights for marketing, support, operations, and leadership.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/business-analytics",
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
      name: "Business Analytics",
      item: "https://tellacity.com/solutions/business-analytics",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity Business Analytics turns verified reviews into operational insights",
  description:
    "Tellacity Business Analytics processes every verified review through a six-stage intelligence pipeline so teams get reliable customer reputation data they can act on.",
  totalTime: "PT5M",
  step: WORKFLOW.steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.description,
  })),
};

export default function BusinessAnalyticsSolutionPage() {
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
      <BusinessAnalyticsClient />
    </>
  );
}
