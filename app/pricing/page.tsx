import type { Metadata } from "next";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import { fetchTellacityPlatformReviewSchema } from "@/lib/fetchTellacityPlatformReviewSchema";
import {
  PRICING_PAGE_URL,
  buildPricingSoftwareApplicationJsonLd,
  buildPricingWebPageJsonLd,
} from "@/lib/subscriptionOfferJsonLd";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing | Tellacity",
  description:
    "Compare Tellacity pricing plans for businesses — Free, Grow, Premium, and Elite — with transparent limits for review invites, blogs & case studies, photos, widgets, and team tools.",
  alternates: { canonical: PRICING_PAGE_URL },
  openGraph: {
    title: "Pricing | Tellacity",
    description:
      "Compare Tellacity pricing plans for businesses — Free, Grow, Premium, and Elite — with transparent limits for review invites, blogs & case studies, photos, widgets, and team tools.",
    url: PRICING_PAGE_URL,
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
      "Compare Tellacity pricing plans for businesses — Free, Grow, Premium, and Elite — with transparent limits for review invites, blogs & case studies, photos, widgets, and team tools.",
  },
  robots: { index: true, follow: true },
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const supabase = createClient();
  const reviewSchema = await fetchTellacityPlatformReviewSchema(supabase);
  const pricingJsonLd = buildPricingWebPageJsonLd();
  const pricingSoftwareJsonLd = buildPricingSoftwareApplicationJsonLd(reviewSchema);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pricingSoftwareJsonLd),
        }}
      />
      <PricingPageContent variant="public" />
    </>
  );
}
