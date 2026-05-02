import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
};

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createClient();

  const { data: statusProbe } = await supabase
    .from("businesses")
    .select("status")
    .eq("slug", slug.trim().toLowerCase())
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
    .select("name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  let business: BusinessMetaRow | null = businessBySlug;

  if (!business) {
    const normalized = slug.trim().toLowerCase();
    const cleanSlug = cleanSlugForRedirect(slug);
    if (cleanSlug && cleanSlug !== normalized) {
      const { data: fallbackRow } = await supabase
        .from("businesses")
        .select("name, slug")
        .eq("slug", cleanSlug)
        .eq("status", "active")
        .maybeSingle();
      business = fallbackRow ?? null;
    }
  }

  if (!business) {
    return {
      title: `${slug} Reviews | Tellacity`,
    };
  }

  const name = String(business.name ?? "").trim() || slug;

  return {
    title: `${name} Reviews | Tellacity`,
    description: `Read verified customer reviews of ${name}. See ratings, feedback and real experiences from customers on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/b/${business.slug}`,
    },
  };
}

export default async function BusinessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const normalizedSlug = slug.trim().toLowerCase();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isRedirected =
    resolvedSearchParams.redirected === "1" ||
    (Array.isArray(resolvedSearchParams.redirected) &&
      resolvedSearchParams.redirected.includes("1"));
  const hasSearchParams = Object.keys(resolvedSearchParams).length > 0;

  if (hasSearchParams && !resolvedSearchParams.redirected) {
    console.log("STRIPPING_QUERY_PARAMS_SAFE");

    redirect(`/b/${normalizedSlug}?redirected=1`);
  }

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
    const { data } = await supabase
      .from("businesses")
      .select("slug")
      .eq("canonical_slug", cleanSlug)
      .eq("status", "active")
      .maybeSingle();

    if (data?.slug) {
      redirect(`/b/${data.slug}`);
    }

    return notFound();
  }

  const primaryPhotosRes = await applyBusinessPhotosOrdering(
    supabase
      .from("business_photos")
      .select("id, url, section, created_at, is_cover, sort_order, status, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url")
      .eq("business_id", String(business.id))
      .eq("status", "published")
      // Publish-first visibility: rows are live as soon as the owner
      // publishes them, and an admin `Reject` / `Flag` flips `is_live`
      // back to false to pull them down. RLS also enforces this — the
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

  const finalSlug = business.slug.toLowerCase();
  const currentSlug = normalizedSlug;

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

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: String((business as { name?: string | null }).name ?? ""),
    url: `https://tellacity.com/b/${business.slug}`,
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

  // 🚫 HARD LOOP PREVENTION
  if (finalSlug === currentSlug) {
    return renderBusinessClient();
  }

  // 🚫 DO NOT REDIRECT IF THIS SLUG ALREADY LOOKS CANONICAL
  if (normalizedSlug === business.slug.toLowerCase()) {
    return renderBusinessClient();
  }

  // 🚫 ONLY redirect if we are SURE this is a different valid slug
  if (!isRedirected && finalSlug !== currentSlug) {
    console.log("REDIRECT_DISABLED", {
      currentSlug,
      finalSlug,
    });
  }

  console.log("Business found:", (business as { name?: string | null }).name);
  return renderBusinessClient();
}
