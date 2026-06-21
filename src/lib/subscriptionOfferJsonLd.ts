import { PAID_PLAN_USD } from "@/lib/billingPlanConfirm";

export const PRICING_PAGE_URL = "https://tellacity.com/pricing";
export const PRICING_PRODUCT_IMAGE =
  "https://tellacity.com/brand/Tellacity%20Dash.png";
const TERMS_URL = "https://tellacity.com/terms-of-service";

/** Markets where Tellacity business plans are sold. */
const SUPPORTED_COUNTRY_CODES = ["US", "GB", "ZA", "AU", "CA", "NZ", "IE"] as const;

export type ProductReviewSchema = {
  aggregateRating: Record<string, unknown>;
  review: Record<string, unknown>[];
};

export function buildSaasMerchantReturnPolicy(): Record<string, unknown> {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: [...SUPPORTED_COUNTRY_CODES],
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: TERMS_URL,
  };
}

/** Digital SaaS delivery, instant access, no physical shipping. */
export function buildDigitalShippingDetails(): Record<string, unknown> {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency: "USD",
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: [...SUPPORTED_COUNTRY_CODES],
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 0,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 0,
        unitCode: "DAY",
      },
    },
  };
}

type SubscriptionOfferInput = {
  name: string;
  price: number;
  url?: string;
};

export function buildSubscriptionOffer({
  name,
  price,
  url = PRICING_PAGE_URL,
}: SubscriptionOfferInput): Record<string, unknown> {
  const offer: Record<string, unknown> = {
    "@type": "Offer",
    name,
    price: String(price),
    priceCurrency: "USD",
    url,
    availability: "https://schema.org/InStock",
    hasMerchantReturnPolicy: buildSaasMerchantReturnPolicy(),
    shippingDetails: buildDigitalShippingDetails(),
  };

  if (price > 0) {
    offer.priceSpecification = {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: "USD",
      unitText: "MONTH",
    };
  }

  return offer;
}

export function buildPricingWebPageJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pricing | Tellacity",
    description:
      "Compare Tellacity pricing plans for businesses, Free, Grow, Premium, and Elite, with transparent limits for review invites, blogs & case studies, photos, widgets, and team tools.",
    url: PRICING_PAGE_URL,
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
          item: PRICING_PAGE_URL,
        },
      ],
    },
  };
}

/**
 * SaaS subscription plans, use SoftwareApplication (not Product) so Google does not
 * expect physical-product merchant listings on the pricing page.
 */
export function buildPricingSoftwareApplicationJsonLd(
  reviewSchema?: ProductReviewSchema | null,
): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Tellacity Business Plans",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Tellacity reputation and review plans for businesses, from Free through Elite, with monthly limits for review invites, blogs & case studies, photos, and widgets.",
    image: [PRICING_PRODUCT_IMAGE],
    url: PRICING_PAGE_URL,
    brand: { "@type": "Brand", name: "Tellacity" },
    offers: [
      buildSubscriptionOffer({ name: "Free", price: 0 }),
      buildSubscriptionOffer({
        name: "Grow",
        price: PAID_PLAN_USD.grow.monthly,
      }),
      buildSubscriptionOffer({
        name: "Premium",
        price: PAID_PLAN_USD.premium.monthly,
      }),
      buildSubscriptionOffer({
        name: "Elite",
        price: PAID_PLAN_USD.elite.monthly,
      }),
    ],
  };

  if (reviewSchema?.aggregateRating) {
    jsonLd.aggregateRating = reviewSchema.aggregateRating;
  }
  if (reviewSchema?.review && reviewSchema.review.length > 0) {
    jsonLd.review = reviewSchema.review;
  }

  return jsonLd;
}

const BEST_RATING = 5;
const WORST_RATING = 1;

function roundRating(value: number): number {
  return Math.round(Math.min(BEST_RATING, Math.max(WORST_RATING, value)) * 10) / 10;
}

function toIsoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return undefined;
  return new Date(parsed).toISOString().slice(0, 10);
}

/** Build optional rating/review blocks from published Tellacity platform reviews. */
export function buildReviewSchemaFromRows(
  averageRating: number,
  reviewCount: number,
  reviewRows: Array<{
    rating?: number | null;
    title?: string | null;
    body?: string | null;
    guest_name?: string | null;
    created_at?: string | null;
  }>,
): ProductReviewSchema | null {
  if (reviewCount <= 0 || averageRating <= 0) return null;

  const reviews = reviewRows
    .map((row) => {
      const reviewBody =
        String(row.body ?? "").trim() || String(row.title ?? "").trim();
      if (!reviewBody) return null;

      const rating = Number(row.rating);
      if (!Number.isFinite(rating) || rating < WORST_RATING || rating > BEST_RATING) {
        return null;
      }

      return {
        "@type": "Review" as const,
        author: {
          "@type": "Person" as const,
          name: String(row.guest_name ?? "").trim() || "Customer",
        },
        reviewRating: {
          "@type": "Rating" as const,
          ratingValue: roundRating(rating),
          bestRating: BEST_RATING,
          worstRating: WORST_RATING,
        },
        reviewBody,
        ...(toIsoDate(row.created_at) ? { datePublished: toIsoDate(row.created_at) } : {}),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];

  return {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: roundRating(averageRating),
      reviewCount: Math.floor(reviewCount),
      ratingCount: Math.floor(reviewCount),
      bestRating: BEST_RATING,
      worstRating: WORST_RATING,
    },
    review: reviews,
  };
}
