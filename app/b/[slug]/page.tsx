import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import SuspendedBusinessPublicView from "@/components/public/SuspendedBusinessPublicView";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { cleanSlugForRedirect } from "@/lib/businessSlug";
import { isBusinessPubliclyActive } from "@/lib/businessPublicAccess";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BusinessMetaRow = {
  name?: string | null;
  slug?: string | null;
  canonical_slug?: string | null;
};

/**
 * Resolve the canonical URL slug for a business row.
 *
 * SEO contract: every business has ONE canonical URL, regardless of how
 * many slug variants exist (city-suffixed, legacy concatenated, query
 * params, etc.). When `canonical_slug` is populated (the brand-clean
 * version), we always advertise `/b/<canonical_slug>` as the canonical.
 * Otherwise we fall back to the row's own slug.
 */
function pickCanonicalSlug(row: BusinessMetaRow): string {
  const canonical = String(row.canonical_slug ?? "").trim().toLowerCase();
  if (canonical) return canonical;
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
    .select("name, slug, canonical_slug")
    .eq("slug", normalized)
    .eq("status", "active")
    .maybeSingle();

  let business: BusinessMetaRow | null = businessBySlug;

  if (!business) {
    const cleanSlug = cleanSlugForRedirect(slug);
    if (cleanSlug && cleanSlug !== normalized) {
      const { data: fallbackRow } = await supabase
        .from("businesses")
        .select("name, slug, canonical_slug")
        .eq("slug", cleanSlug)
        .eq("status", "active")
        .maybeSingle();
      business = fallbackRow ?? null;
    }
  }

  // Canonical-slug fallback: when the URL happens to be the brand-clean
  // canonical (e.g. `/b/tadibrothers` while the row lives at
  // `/b/tadibrothers-reseda`), resolve via `canonical_slug` so the page
  // still serves 200 and emits a clean canonical tag.
  if (!business) {
    const { data: byCanonical } = await supabase
      .from("businesses")
      .select("name, slug, canonical_slug")
      .eq("canonical_slug", normalized)
      .eq("status", "active")
      .maybeSingle();
    business = byCanonical ?? null;
  }

  if (!business) {
    return {
      title: `${slug} Reviews | Tellacity`,
    };
  }

  const name = String(business.name ?? "").trim() || slug;
  const canonicalSlug = pickCanonicalSlug(business);

  return {
    title: `${name} Reviews | Tellacity`,
    description: `Read verified customer reviews of ${name}. See ratings, feedback and real experiences from customers on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/b/${canonicalSlug}`,
    },
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
    const nm = String((business as { name?: string | null }).name ?? "").trim();
    return <SuspendedBusinessPublicView businessName={nm || undefined} />;
  }

  if (!business) {
    // Canonical-slug fallback: `/b/<canonical_slug>` should ALSO serve 200
    // so the canonical advertised in <head> resolves cleanly. We no longer
    // 308 here because that contradicts the canonical tag (loop) and Google
    // refuses to index either side. Both URLs return 200 with the same row
    // data; the canonical tag tells Google which to index.
    const { data: byCanonical } = await supabase
      .from("businesses")
      .select("*")
      .eq("canonical_slug", cleanSlug)
      .eq("status", "active")
      .maybeSingle();

    if (byCanonical) {
      business = byCanonical;
    } else {
      return notFound();
    }
  }

  const primaryPhotosRes = await applyBusinessPhotosOrdering(
    supabase
      .from("business_photos")
      .select("id, url, section, created_at, is_cover, sort_order, status, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url")
      .eq("business_id", String(business.id))
      .eq("status", "published")
      // Publish-first visibility: rows are live as soon as the owner
      // publishes them, and an admin `Reject` / `Flag` flips `is_live`
      // back to false to pull them down. RLS also enforces this; the
      // explicit filter lets the planner use
      // `business_photos_public_live_idx` and documents the intent.
      .eq("is_live", true)
  );
  const { data: businessPhotosRows } = primaryPhotosRes.error
    ? await applyBusinessPhotosOrdering(
        supabase
          .from("business_photos")
          .select(
            "id, url, section, created_at, is_cover, sort_order, status, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url"
          )
          .eq("business_id", String(business.id))
          .eq("status", "published")
          .eq("is_live", true)
      )
    : primaryPhotosRes;

  const initialBusinessPhotos: BusinessPhotoPublic[] = (businessPhotosRows ?? []).map((row) => ({
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
    product_name: (row as { product_name?: string | null }).product_name ?? null,
    product_description:
      (row as { product_description?: string | null }).product_description ?? null,
    product_price:
      typeof (row as { product_price?: number | null }).product_price === "number"
        ? (row as { product_price?: number | null }).product_price ?? null
        : null,
    product_currency: (() => {
      const c = (row as { product_currency?: string | null }).product_currency;
      if (typeof c === "string" && c.trim()) return c.trim().toUpperCase().slice(0, 3);
      return "USD";
    })(),
    product_redirect_url: (() => {
      const u = (row as { product_redirect_url?: string | null }).product_redirect_url;
      if (typeof u === "string" && u.trim()) return u.trim();
      return null;
    })(),
  })).filter((p) => p.id && p.url);

  // Claimed = business has a registered owner. When false we show the
  // "Claim this profile" teaser in the photos section; when true we show a
  // clean empty-state with no stock imagery.
  const initialIsClaimed = Boolean(
    (business as { owner_id?: string | null }).owner_id
  );

  const averageRating = (business as { average_rating?: number | null })
    .average_rating;
  const reviewCount = (business as { review_count?: number | null })
    .review_count;

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
    .map((r) => {
      const reviewBody =
        String(r.body ?? "").trim() ||
        String(r.title ?? "").trim();
      if (!reviewBody) return null;
      if (!r.rating || Number(r.rating) <= 0) return null;
      return {
        "@type": "Review" as const,
        author: {
          "@type": "Person" as const,
          name: String(r.guest_name ?? "").trim() || "Customer",
        },
        reviewRating: {
          "@type": "Rating" as const,
          ratingValue: Math.min(5, Math.max(1, Number(r.rating))),
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

  const canonicalSlugForJsonLd = pickCanonicalSlug({
    slug: (business as { slug?: string | null }).slug ?? null,
    canonical_slug: (business as { canonical_slug?: string | null }).canonical_slug ?? null,
  });

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: String((business as { name?: string | null }).name ?? ""),
    url: `https://tellacity.com/b/${canonicalSlugForJsonLd}`,
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

  const renderBusinessClient = () => (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <BusinessClient
        initialBusiness={business}
        initialBusinessPhotos={initialBusinessPhotos}
        initialIsClaimed={initialIsClaimed}
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
