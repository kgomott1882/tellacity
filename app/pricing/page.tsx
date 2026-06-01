import type { Metadata } from "next";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import { PAID_PLAN_USD } from "@/lib/billingPlanConfirm";

const PAGE_URL = "https://tellacity.com/pricing";

export const metadata: Metadata = {
  title: "Pricing | Tellacity",
  description:
    "Compare Tellacity pricing plans for businesses, including Free, Grow, Premium, Elite, and Custom options with transparent features and limits.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Pricing | Tellacity",
    description:
      "Compare Tellacity pricing plans for businesses, including Free, Grow, Premium, Elite, and Custom options with transparent features and limits.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
    images: [
      {
        url: "https://tellacity.com/brand/Tellacity%20Dash.png",
        alt: "Tellacity business dashboard and pricing plans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing | Tellacity",
    description:
      "Compare Tellacity pricing plans for businesses, including Free, Grow, Premium, Elite, and Custom options with transparent features and limits.",
  },
  robots: { index: true, follow: true },
};

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Pricing | Tellacity",
  description:
    "Compare Tellacity pricing plans for businesses, including Free, Grow, Premium, Elite, and Custom options with transparent features and limits.",
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
        name: "Pricing",
        item: PAGE_URL,
      },
    ],
  },
};

const PRICING_PRODUCT_IMAGE =
  "https://tellacity.com/brand/Tellacity%20Dash.png";

const pricingOffersJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Tellacity Business Plans",
  description:
    "Tellacity reputation and review plans for businesses, from Free through Elite.",
  image: [PRICING_PRODUCT_IMAGE],
  brand: { "@type": "Brand", name: "Tellacity" },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      url: PAGE_URL,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Grow",
      price: String(PAID_PLAN_USD.grow.monthly),
      priceCurrency: "USD",
      url: PAGE_URL,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: PAID_PLAN_USD.grow.monthly,
        priceCurrency: "USD",
        unitText: "MONTH",
      },
    },
    {
      "@type": "Offer",
      name: "Premium",
      price: String(PAID_PLAN_USD.premium.monthly),
      priceCurrency: "USD",
      url: PAGE_URL,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: PAID_PLAN_USD.premium.monthly,
        priceCurrency: "USD",
        unitText: "MONTH",
      },
    },
    {
      "@type": "Offer",
      name: "Elite",
      price: String(PAID_PLAN_USD.elite.monthly),
      priceCurrency: "USD",
      url: PAGE_URL,
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: PAID_PLAN_USD.elite.monthly,
        priceCurrency: "USD",
        unitText: "MONTH",
      },
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingOffersJsonLd),
        }}
      />
      <PricingPageContent variant="public" />
    </>
  );
}
