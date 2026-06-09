import type { Metadata } from "next";
import ReviewWidgetsClient from "./ReviewWidgetsClient";
import { WORKFLOW } from "./reviewWidgetsData";

export const metadata: Metadata = {
  title: "Live Verified Review Widgets for Every Page of Your Site | Tellacity",
  description:
    "Show real, verified customer reviews directly on product pages, pricing, checkout, and marketing pages. Tellacity widgets stay in sync with your dashboard and update automatically. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/review-widgets",
  },
  openGraph: {
    title: "Live Verified Review Widgets for Every Page of Your Site | Tellacity",
    description:
      "Show real, verified customer reviews directly on product pages, pricing, checkout, and marketing pages. Tellacity widgets stay in sync with your dashboard and update automatically.",
    url: "https://tellacity.com/solutions/review-widgets",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Verified Review Widgets for Every Page of Your Site | Tellacity",
    description:
      "Live, verified review widgets for product, pricing, checkout, and marketing pages. Synced with your dashboard automatically.",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Review Widgets",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Show live, verified customer reviews directly on storefronts, product pages, pricing, checkout, and marketing pages using lightweight, embeddable widgets.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/review-widgets",
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
      name: "Review Widgets",
      item: "https://tellacity.com/solutions/review-widgets",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity review widgets turn verified reviews into live trust signals",
  description:
    "The six-step pipeline that turns verified customer reviews into live, on-page trust signals across every Tellacity widget placement.",
  totalTime: "PT5M",
  step: WORKFLOW.steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.description,
  })),
};

export default function ReviewWidgetsSolutionPage() {
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
      <ReviewWidgetsClient />
    </>
  );
}
