import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import {
  createPlanResolutionAdminClient,
  loadPublicBusinessPhotosForDisplay,
} from "@/lib/loadPublicBusinessPhotos";
import { cleanSlugForRedirect } from "@/lib/businessSlug";
import { isBusinessPubliclyActive } from "@/lib/businessPublicAccess";
import { getCountryName, cleanLocationField, cleanBusinessDisplayName } from "@/lib/address";
import { buildBusinessProfileJsonLdScripts } from "@/lib/businessReviewJsonLd";
import {
  BUSINESS_PROFILE_REVIEWS_JSON_LD_LIMIT,
  BUSINESS_PROFILE_REVIEWS_SSR_LIMIT,
  fetchBusinessProfileReviewsPage,
  type BusinessProfileReview,
} from "@/lib/businessProfileReviews";
import { getPublishedVisibleReviewAggregates } from "@/lib/reviewAggregatesForBusiness";
import { businessProfileRobots } from "@/lib/businessIndexability";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BusinessMetaRow = {
  name?: string | null;
  slug?: string | null;
  country_code?: string | null;
  city?: string | null;
};

const BUSINESS_META_SELECT =
  "name, slug, country_code, city";

/** Public business profile URLs and canonical tags are always built from `businesses.slug`. */
function pickPublicSlug(row: BusinessMetaRow): string {
  const slug = String(row.slug ?? "").trim().toLowerCase();
  return slug;
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createClient();
  const normalized = slug.trim().toLowerCase();

  const { data: statusProbe } = await supabase
    .from("businesses")
    .select("status")
    .eq("slug", normalized)
    .maybeSingle();

  if (
    statusProbe &&
    typeof statusProbe === "object" &&
    !isBusinessPubliclyActive(
      (statusProbe as { status?: string | null }).status,
    )
  ) {
    return {
      title: "Business unavailable | Tellacity",
      robots: { index: false, follow: false },
    };
  }

  const { data: businessBySlug } = await supabase
    .from("businesses")
    .select(BUSINESS_META_SELECT)
    .eq("slug", normalized)
    .eq("status", "active")
    .maybeSingle();

  let business: BusinessMetaRow | null = businessBySlug;

  if (!business) {
    const cleanSlug = cleanSlugForRedirect(slug);
    if (cleanSlug && cleanSlug !== normalized) {
      const { data: fallbackRow } = await supabase
        .from("businesses")
        .select(BUSINESS_META_SELECT)
        .eq("slug", cleanSlug)
        .eq("status", "active")
        .maybeSingle();
      business = fallbackRow ?? null;
    }
  }

  if (!business) {
    return {
      title: `${slug} Reviews | Tellacity`,
      robots: { index: false, follow: false },
    };
  }

  const name = cleanBusinessDisplayName(String(business.name ?? "").trim() || slug);
  const publicSlug = pickPublicSlug(business);
  const countryCode = String(business.country_code ?? "").trim();
  const cityLabel = cleanLocationField(business.city);
  const countryLabel =
    getCountryName(countryCode) ||
    cityLabel ||
    countryCode ||
    "your region";
  const locationPhrase =
    countryLabel && countryLabel !== "your region"
      ? ` in ${countryLabel}`
      : "";
  const pageTitle = `${name} Reviews | Ratings, Photos & TrustScore | Tellacity`;
  const pageDescription = `Read verified customer reviews of ${name}${locationPhrase}. See photos, category rankings, TrustScore, and real customer experiences on Tellacity.`;
  const canonicalUrl = `https://tellacity.com/b/${publicSlug}`;

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${name} Reviews | Tellacity`,
      description: `Read verified customer reviews of ${name}${locationPhrase}. See photos, category rankings, and TrustScore on Tellacity.`,
      url: canonicalUrl,
      siteName: "Tellacity",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} Reviews | Tellacity`,
      description: `Read verified customer reviews of ${name}${locationPhrase}. See photos, category rankings, and TrustScore on Tellacity.`,
    },
    robots: businessProfileRobots(),
  };
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
  // searchParams intentionally not consumed: utm/fbclid pass-through is
  // now handled by <link rel="canonical">, not by a redirect.
}) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();
  // Search params (utm/fbclid/etc.) are intentionally ignored for SEO.
  // The <link rel="canonical"> in generateMetadata is the source of
  // truth for Google; we don't redirect-strip query params anymore
  // because the previous redirect produced a chained ?redirected=1
  // URL that Google indexed as "Page with redirect".
  const supabase = createClient();

  // Always use normalized slug
  const cleanSlug = normalizedSlug;

  // Full row for BusinessClient (includes `tags` and rating aggregates on
  // `businesses`).
  let { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", cleanSlug)
    .maybeSingle();

  // Final fallback: remove "unitedstates" style suffix if needed
  if (!business) {
    const stripped = cleanSlug.replace("unitedstates", "").trim();

    const { data: fallbackBusiness } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", stripped)
      .maybeSingle();

    business = fallbackBusiness;
  }

  if (
    business &&
    !isBusinessPubliclyActive((business as { status?: string | null }).status)
  ) {
    return notFound();
  }

  if (!business) {
    return notFound();
  }

  const planAdmin = createPlanResolutionAdminClient();
  const initialBusinessPhotos: BusinessPhotoPublic[] =
    await loadPublicBusinessPhotosForDisplay({
      supabase,
      planAdmin,
      businessId: String(business.id),
    });

  // Claimed = business has a registered owner. When false we show the
  // "Claim this profile" teaser in the photos section; when true we show a
  // clean empty-state with no stock imagery.
  const initialIsClaimed = Boolean(
    (business as { owner_id?: string | null }).owner_id
  );

  const { data: publishedArticlesRows } = await supabase
    .from("articles")
    .select("id, title, slug, featured_image_url, published_at")
    .eq("business_id", String(business.id))
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(3);

  const initialPublishedArticles = (publishedArticlesRows ?? []).map((row) => ({
    id: String((row as { id: string }).id),
    title: String((row as { title: string }).title),
    slug: String((row as { slug: string }).slug),
    featured_image_url: (row as { featured_image_url?: string | null }).featured_image_url ?? null,
    published_at: (row as { published_at?: string | null }).published_at ?? null,
  }));

  let initialReviews: BusinessProfileReview[] = [];
  let initialTotalReviewCount = 0;
  let initialPublishedReviewAggregates = {
    reviewCount: 0,
    averageRating: 0,
  };
  const businessId = String(business.id);
  try {
    const [aggregates, reviewPack] = await Promise.all([
      getPublishedVisibleReviewAggregates(supabase, businessId),
      fetchBusinessProfileReviewsPage(
        supabase,
        businessId,
        0,
        BUSINESS_PROFILE_REVIEWS_SSR_LIMIT,
      ),
    ]);
    initialPublishedReviewAggregates = aggregates;
    initialReviews = reviewPack.reviews;
    initialTotalReviewCount = reviewPack.totalCount;
  } catch (reviewErr) {
    console.error("[business profile] initial reviews:", reviewErr);
  }

  const publicSlugForJsonLd = pickPublicSlug({
    slug: (business as { slug?: string | null }).slug ?? null,
  });

  const businessJsonLdScripts = await buildBusinessProfileJsonLdScripts(supabase, {
    businessId,
    name: cleanBusinessDisplayName((business as { name?: string | null }).name),
    url: `https://tellacity.com/b/${publicSlugForJsonLd}`,
    logoUrl: (business as { logo_url?: string | null }).logo_url,
    phone: (business as { phone?: string | null }).phone,
    email: (business as { email?: string | null }).email,
    address: cleanLocationField((business as { address?: string | null }).address),
    city: cleanLocationField((business as { city?: string | null }).city),
    postcode: (business as { postcode?: string | null }).postcode,
    countryCode: (business as { country_code?: string | null }).country_code,
    photos: initialBusinessPhotos.map((photo) => ({
      id: photo.id,
      url: photo.url,
    })),
    profileReviewsForJsonLd: initialReviews.slice(
      0,
      BUSINESS_PROFILE_REVIEWS_JSON_LD_LIMIT,
    ),
    publishedReviewAggregates: initialPublishedReviewAggregates,
  });

  const renderBusinessClient = () => (
    <>
      {businessJsonLdScripts.map((script, index) => (
        <script
          key={`business-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(script) }}
        />
      ))}
      <BusinessClient
        initialBusiness={business}
        initialBusinessPhotos={initialBusinessPhotos}
        initialIsClaimed={initialIsClaimed}
        initialPublishedArticles={initialPublishedArticles}
        initialReviews={initialReviews}
        initialTotalReviewCount={initialTotalReviewCount}
        initialPublishedReviewAggregates={initialPublishedReviewAggregates}
      />
    </>
  );

  // The canonical URL for any active row is its own `business.slug`.
  // No redirect is performed when the row is already loaded, even if the
  // requested URL slug differs (e.g. case mismatch), the canonical
  // <link rel="canonical"> in <head> tells Google which URL to index.
  // Multi-location chain rows (e.g. Greenleaf Tobacco & Vape across
  // 11 Iowa towns) intentionally each keep their own URL.
  return renderBusinessClient();
}
