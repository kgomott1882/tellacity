import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { getActivePlanKeyForBusiness, type PlanKey } from "@/lib/plans";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { supabaseServer as supabaseServiceRole } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

function normalizeDomain(rawDomain: string): string {
  const decoded = decodeURIComponent(rawDomain).trim().toLowerCase();
  const withoutProtocol = decoded.replace(/^https?:\/\//, "");
  const withoutWww = withoutProtocol.replace(/^www\./, "");
  const beforePath = withoutWww.split("/")[0] ?? "";
  return beforePath.trim();
}

async function getBusinessByDomain(domain: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("businesses")
    .select("*")
    .or(`website.ilike.${domain}%,website.ilike.www.${domain}%`)
    .eq("status", "active")
    .order("review_count", { ascending: false, nullsFirst: false })
    .order("trust_score", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function generateMetadata(
  props: { params: Promise<{ domain: string }> }
): Promise<Metadata> {
  const { domain } = await props.params;
  const normalizedDomain = normalizeDomain(domain);
  const business = normalizedDomain
    ? await getBusinessByDomain(normalizedDomain)
    : null;

  if (!business) {
    return {
      title: `${normalizedDomain || domain} Reviews | Tellacity`,
      alternates: {
        canonical: `https://tellacity.com/review/${normalizedDomain || domain}`,
      },
    };
  }

  const businessName =
    String((business as { name?: string | null }).name ?? "").trim() ||
    normalizedDomain;

  return {
    title: `${businessName} Reviews | Tellacity`,
    description: `Read verified customer reviews of ${businessName}. See ratings, feedback and real experiences from customers on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/review/${normalizedDomain}`,
    },
  };
}

export default async function DomainReviewPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const normalizedDomain = normalizeDomain(domain);

  if (!normalizedDomain) {
    return notFound();
  }

  const supabase = createClient();
  const business = await getBusinessByDomain(normalizedDomain);

  if (!business) {
    return notFound();
  }

  const primaryPhotosRes = await applyBusinessPhotosOrdering(
    supabase
      .from("business_photos")
      .select("id, url, section, created_at, is_cover, sort_order, status, preview_zoom, preview_x, preview_y, preview_frame")
      .eq("business_id", String(business.id))
      .eq("status", "published")
      .eq("is_live", true)
  );
  const { data: businessPhotosRows } = primaryPhotosRes.error
    ? await applyBusinessPhotosOrdering(
        supabase
          .from("business_photos")
          .select("id, url, section, created_at, is_cover, sort_order, status")
          .eq("business_id", String(business.id))
          .eq("status", "published")
          .eq("is_live", true)
      )
    : primaryPhotosRes;

  const initialBusinessPhotos: BusinessPhotoPublic[] = (businessPhotosRows ?? [])
    .map((row) => ({
      id: String((row as { id?: string }).id ?? ""),
      url: String((row as { url?: string }).url ?? ""),
      section: String((row as { section?: string }).section ?? "gallery"),
      sort_order: Number((row as { sort_order?: unknown }).sort_order) || 0,
      created_at: (row as { created_at?: string | null }).created_at ?? null,
      is_cover: (row as { is_cover?: boolean | null }).is_cover === true,
      preview_zoom: Number((row as { preview_zoom?: unknown }).preview_zoom) || 1,
      preview_x: Number((row as { preview_x?: unknown }).preview_x) || 50,
      preview_y: Number((row as { preview_y?: unknown }).preview_y) || 50,
      preview_frame:
        String((row as { preview_frame?: string | null }).preview_frame ?? "landscape") ===
        "portrait"
          ? ("portrait" as const)
          : ("landscape" as const),
    }))
    .filter((photo) => photo.id && photo.url);

  const { data: sectionRows } = await supabase
    .from("business_photo_sections")
    .select("slug, title, is_enabled, sort_order")
    .eq("business_id", String(business.id))
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  const initialSections = (sectionRows ?? [])
    .map((row) => ({
      slug: String((row as { slug?: string }).slug ?? ""),
      title: String((row as { title?: string }).title ?? ""),
      is_enabled: (row as { is_enabled?: boolean }).is_enabled !== false,
      sort_order: Number((row as { sort_order?: unknown }).sort_order) || 0,
    }))
    .filter((section) => section.slug && section.title);

  const initialIsClaimed = Boolean(
    (business as { owner_id?: string | null }).owner_id
  );

  let initialPlanKey: PlanKey = "free";
  try {
    initialPlanKey = await getActivePlanKeyForBusiness(
      String(business.id),
      supabaseServiceRole
    );
  } catch {
    initialPlanKey = "free";
  }

  const averageRating = (business as { average_rating?: number | null })
    .average_rating;
  const reviewCount = (business as { review_count?: number | null }).review_count;

  type JsonLdReviewRow = {
    rating?: number | null;
    title?: string | null;
    body?: string | null;
    guest_name?: string | null;
  };

  let jsonLdReviewRows: JsonLdReviewRow[] = [];
  if (Number(reviewCount ?? 0) > 0) {
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("rating, title, body, guest_name, status")
      .eq("business_id", String(business.id))
      .in("status", ["published", "live"])
      .order("created_at", { ascending: false })
      .limit(3);

    jsonLdReviewRows = Array.isArray(reviewRows) ? reviewRows : [];
  }

  const jsonLdReviews = jsonLdReviewRows
    .map((review) => {
      const reviewBody =
        String(review.body ?? "").trim() ||
        String(review.title ?? "").trim();
      if (!reviewBody) return null;
      if (!review.rating || Number(review.rating) <= 0) return null;

      return {
        "@type": "Review" as const,
        author: {
          "@type": "Person" as const,
          name: String(review.guest_name ?? "").trim() || "Customer",
        },
        reviewRating: {
          "@type": "Rating" as const,
          ratingValue: Math.min(5, Math.max(1, Number(review.rating))),
        },
        reviewBody,
      };
    })
    .filter(Boolean)
    .slice(0, 3);

  const normalizedReviewCount = Number(reviewCount ?? 0);
  const normalizedAverageRating = Number(averageRating ?? 0);
  const shouldIncludeReviewData =
    jsonLdReviews.length > 0 &&
    normalizedReviewCount > 0 &&
    normalizedAverageRating > 0;

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: String((business as { name?: string | null }).name ?? ""),
    url: `https://tellacity.com/review/${normalizedDomain}`,
    ...(shouldIncludeReviewData
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: normalizedAverageRating,
            reviewCount: normalizedReviewCount,
          },
          review: jsonLdReviews,
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <BusinessClient
        initialBusiness={business}
        initialBusinessPhotos={initialBusinessPhotos}
        initialPhotoSections={initialSections}
        initialIsClaimed={initialIsClaimed}
        initialPlanKey={initialPlanKey}
      />
    </>
  );
}
