import type { SupabaseClient } from "@supabase/supabase-js";
import { cleanLocationField } from "@/lib/address";
import {
  type BusinessProfileReview,
  BUSINESS_PROFILE_REVIEWS_JSON_LD_LIMIT,
  fetchBusinessProfileReviewsPage,
} from "@/lib/businessProfileReviews";
import { getPublishedVisibleReviewAggregates } from "@/lib/reviewAggregatesForBusiness";

const BEST_RATING = 5;
const WORST_RATING = 1;
const TERMS_URL = "https://tellacity.com/terms-of-service";
const LICENSE_PAGE_URL = TERMS_URL;
const TELLACITY_SITE_URL = "https://tellacity.com";

/** Third-party review platform hosting reviews about the listed business. */
const TELLACITY_PUBLISHER = {
  "@type": "Organization" as const,
  name: "Tellacity",
  url: TELLACITY_SITE_URL,
};

export type PublishedReviewAggregates = {
  reviewCount: number;
  averageRating: number;
};

export type BusinessProfileJsonLdInput = {
  businessId: string;
  name: string;
  url: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  countryCode?: string | null;
  photos?: { id: string; url: string }[];
  /** When set, nested Review JSON-LD uses these rows (same filter as the visible list). */
  profileReviewsForJsonLd?: BusinessProfileReview[];
  /** When set, avoids a duplicate aggregate query and aligns with visible hero counts. */
  publishedReviewAggregates?: PublishedReviewAggregates;
};

function clampRating(value: number): number {
  return Math.min(BEST_RATING, Math.max(WORST_RATING, value));
}

function roundRating(value: number): number {
  return Math.round(clampRating(value) * 10) / 10;
}

function toIsoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return undefined;
  return new Date(parsed).toISOString().slice(0, 10);
}

function buildPostalAddress(
  opts: Pick<
    BusinessProfileJsonLdInput,
    "address" | "city" | "postcode" | "countryCode"
  >,
): Record<string, unknown> | undefined {
  const streetAddress = cleanLocationField(opts.address);
  const addressLocality = cleanLocationField(opts.city);
  const postalCode = cleanLocationField(opts.postcode);
  const addressCountry = cleanLocationField(opts.countryCode).toUpperCase();

  if (!streetAddress && !addressLocality && !postalCode && !addressCountry) {
    return undefined;
  }

  return {
    "@type": "PostalAddress",
    ...(streetAddress ? { streetAddress } : {}),
    ...(addressLocality ? { addressLocality } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(addressCountry ? { addressCountry } : {}),
  };
}

function buildImageObjectJsonLd(
  businessName: string,
  businessPageUrl: string,
  photo: { id: string; url: string },
): Record<string, unknown> {
  const year = new Date().getFullYear();
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    name: `${businessName} business photo`,
    contentUrl: photo.url,
    description: `Interior, product, or experience photo uploaded by ${businessName} on Tellacity.`,
    license: LICENSE_PAGE_URL,
    acquireLicensePage: LICENSE_PAGE_URL,
    creator: {
      "@type": "Organization",
      name: businessName,
      url: businessPageUrl,
    },
    creditText: `${businessName} via Tellacity`,
    copyrightNotice: `© ${year} ${businessName}. All rights reserved.`,
  };
}

/** Map visible profile reviews to nested schema.org Review objects. */
export function mapProfileReviewsToJsonLdReviews(
  profileReviews: BusinessProfileReview[],
): Record<string, unknown>[] {
  return profileReviews
    .map((row) => {
      const reviewBody = row.body.trim() || row.title.trim();
      if (!reviewBody) return null;

      const rating = Number(row.rating);
      if (!Number.isFinite(rating) || rating < WORST_RATING || rating > BEST_RATING) {
        return null;
      }

      const datePublished = toIsoDate(row.createdAtRaw);
      const authorName = row.reviewerName.trim() || "Customer";

      // Reviews nested under LocalBusiness must not include `itemReviewed`
      // (Google: directional conflict with the parent entity).
      return {
        "@type": "Review" as const,
        author: {
          "@type": "Person" as const,
          name: authorName,
        },
        publisher: TELLACITY_PUBLISHER,
        reviewRating: {
          "@type": "Rating" as const,
          ratingValue: roundRating(rating),
          bestRating: BEST_RATING,
          worstRating: WORST_RATING,
        },
        reviewBody,
        ...(datePublished ? { datePublished } : {}),
      };
    })
    .filter(Boolean) as Record<string, unknown>[];
}

/**
 * JSON-LD blocks for business profile SEO: LocalBusiness (+ ratings/reviews),
 * plus ImageObject entries for logo and uploaded photos.
 */
export async function buildBusinessProfileJsonLdScripts(
  db: SupabaseClient,
  opts: BusinessProfileJsonLdInput,
): Promise<Record<string, unknown>[]> {
  const pageUrl = opts.url.trim();
  const businessName = opts.name.trim();
  const logoUrl = String(opts.logoUrl ?? "").trim();
  const phone = String(opts.phone ?? "").trim();
  const email = String(opts.email ?? "").trim();
  const postalAddress = buildPostalAddress(opts);

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": pageUrl,
    name: businessName,
    url: pageUrl,
    publisher: TELLACITY_PUBLISHER,
    ...(logoUrl ? { image: logoUrl } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(email ? { email } : {}),
    ...(postalAddress ? { address: postalAddress } : {}),
  };

  const { reviewCount, averageRating } =
    opts.publishedReviewAggregates ??
    (await getPublishedVisibleReviewAggregates(db, opts.businessId));

  const scripts: Record<string, unknown>[] = [];

  if (reviewCount <= 0 || averageRating <= 0) {
    scripts.push(localBusiness);
  } else {
    const ratingValue = roundRating(averageRating);
    const normalizedReviewCount = Math.floor(reviewCount);

    let profileReviewsForJsonLd = opts.profileReviewsForJsonLd;
    if (!profileReviewsForJsonLd) {
      const { reviews } = await fetchBusinessProfileReviewsPage(
        db,
        opts.businessId,
        0,
        BUSINESS_PROFILE_REVIEWS_JSON_LD_LIMIT,
      );
      profileReviewsForJsonLd = reviews;
    }

    const reviews = mapProfileReviewsToJsonLdReviews(profileReviewsForJsonLd);

    scripts.push({
      ...localBusiness,
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue,
        reviewCount: normalizedReviewCount,
        ratingCount: normalizedReviewCount,
        bestRating: BEST_RATING,
        worstRating: WORST_RATING,
      },
      ...(reviews.length > 0 ? { review: reviews } : {}),
    });
  }

  const photos = (opts.photos ?? []).filter((p) => p.id && p.url).slice(0, 8);
  for (const photo of photos) {
    scripts.push(buildImageObjectJsonLd(businessName, pageUrl, photo));
  }

  if (logoUrl && !photos.some((p) => p.url === logoUrl)) {
    scripts.push(
      buildImageObjectJsonLd(businessName, pageUrl, { id: "logo", url: logoUrl }),
    );
  }

  return scripts;
}

/** @deprecated Use buildBusinessProfileJsonLdScripts */
export async function buildBusinessLocalBusinessJsonLd(
  db: SupabaseClient,
  opts: { businessId: string; name: string; url: string },
): Promise<Record<string, unknown>> {
  const scripts = await buildBusinessProfileJsonLdScripts(db, opts);
  return scripts[0] ?? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: opts.name,
    url: opts.url,
  };
}
