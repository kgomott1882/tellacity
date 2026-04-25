import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { cleanSlugForRedirect } from "@/lib/businessSlug";
import { getActivePlanKeyForBusiness, type PlanKey } from "@/lib/plans";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { supabaseServer as supabaseServiceRole } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type BusinessMetaRow = {
  name?: string | null;
  slug?: string | null;
  canonical_slug?: string | null;
};

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createClient();

  const { data: businessBySlug } = await supabase
    .from("businesses")
    .select("name, slug, canonical_slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  let business: BusinessMetaRow | null = businessBySlug;

  if (!business) {
    const { data: businessByCanonical } = await supabase
      .from("businesses")
      .select("name, slug, canonical_slug")
      .eq("canonical_slug", slug.trim())
      .eq("status", "active")
      .maybeSingle();

    if (businessByCanonical) {
      business = businessByCanonical;
    }
  }

  if (!business) {
    const normalized = slug.trim().toLowerCase();
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

  if (!business) {
    return {
      title: `${slug} Reviews | Tellacity`,
    };
  }

  const finalSlug = business.canonical_slug || business.slug || slug;
  const name = String(business.name ?? "").trim() || slug;

  return {
    title: `${name} Reviews | Tellacity`,
    description: `Read verified customer reviews of ${name}. See ratings, feedback and real experiences from customers on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/b/${finalSlug}`,
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

  // Full row for BusinessClient (includes `tags` and rating aggregates on `businesses`).
  // Single lookup that matches either `slug` or `canonical_slug`. Previously
  // we only queried by `slug`, which caused valid canonical-slug URLs to 404
  // and Next.js to inject <meta name="robots" content="noindex">, which was
  // de-indexing otherwise-live business pages from Google.
  let { data: business } = await supabase
    .from("businesses")
    .select("*")
    .or(`slug.eq.${cleanSlug},canonical_slug.eq.${cleanSlug}`)
    .maybeSingle();

  // Final fallback: remove "unitedstates" style suffix if needed
  if (!business) {
    const stripped = cleanSlug.replace("unitedstates", "").trim();

    const { data: fallbackBusiness } = await supabase
      .from("businesses")
      .select("*")
      .or(`slug.eq.${stripped},canonical_slug.eq.${stripped}`)
      .maybeSingle();

    business = fallbackBusiness;
  }

  if (!business) {
    console.log("NO_BUSINESS_RENDER", { inputSlug: normalizedSlug });
    return notFound();
  }

  const canonicalSlug =
    typeof business.canonical_slug === "string" ? business.canonical_slug.trim() : "";
  if (canonicalSlug && cleanSlug !== canonicalSlug.toLowerCase()) {
    redirect(`/b/${canonicalSlug}`);
  }

  const { data: businessPhotosRows } = await applyBusinessPhotosOrdering(
    supabase
      .from("business_photos")
      .select("id, url, section, created_at, is_cover, sort_order, status")
      .eq("business_id", String(business.id))
      .eq("status", "published")
      // Publish-first visibility: rows are live as soon as the owner
      // publishes them, and an admin `Reject` / `Flag` flips `is_live`
      // back to false to pull them down. RLS also enforces this — the
      // explicit filter lets the planner use
      // `business_photos_public_live_idx` and documents the intent.
      .eq("is_live", true)
  );

  const initialBusinessPhotos: BusinessPhotoPublic[] = (businessPhotosRows ?? []).map((row) => ({
    id: String((row as { id?: string }).id ?? ""),
    url: String((row as { url?: string }).url ?? ""),
    section: String((row as { section?: string }).section ?? "gallery"),
    sort_order: Number((row as { sort_order?: unknown }).sort_order) || 0,
    created_at: (row as { created_at?: string | null }).created_at ?? null,
    is_cover: (row as { is_cover?: boolean | null }).is_cover === true,
  })).filter((p) => p.id && p.url);

  const { data: sectionRows } = await supabase
    .from("business_photo_sections")
    .select("slug, title, is_enabled, sort_order")
    .eq("business_id", String(business.id))
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true });

  const initialSections = (sectionRows ?? []).map((row) => ({
    slug: String((row as { slug?: string }).slug ?? ""),
    title: String((row as { title?: string }).title ?? ""),
    is_enabled: (row as { is_enabled?: boolean }).is_enabled !== false,
    sort_order: Number((row as { sort_order?: unknown }).sort_order) || 0,
  })).filter((s) => s.slug && s.title);

  const finalSlug = business.slug.toLowerCase();
  const currentSlug = normalizedSlug;

  // Claimed = business has a registered owner. When false we show the
  // "Claim this profile" teaser in the photos section; when true we show a
  // clean empty-state with no stock imagery.
  const initialIsClaimed = Boolean(
    (business as { owner_id?: string | null }).owner_id
  );

  // Active billing plan for this business. Drives conversion-focused UX on
  // the public profile — e.g. Free / unclaimed businesses get a grid of
  // empty photo-category placeholders below the hero so the page still
  // feels complete and subtly nudges owners to upload more photos. Paid
  // plans don't get upsold, so we gate the placeholders on this.
  //
  // The public page runs with the anon client which has no RLS access to
  // the `subscriptions` table — use the service-role client for this
  // read-only lookup. The resolved PlanKey is the only thing passed to
  // the client, so no privileged data crosses the wire.
  let initialPlanKey: PlanKey = "free";
  try {
    initialPlanKey = await getActivePlanKeyForBusiness(
      String(business.id),
      supabaseServiceRole
    );
  } catch {
    initialPlanKey = "free";
  }

  const averageRating = Number(
    (business as { average_rating?: number | null }).average_rating ?? 0
  );
  const reviewCount = Number(
    (business as { review_count?: number | null }).review_count ?? 0
  );
  const hasValidRating = averageRating > 0 && reviewCount > 0;
  let jsonLdReviews: Array<{
    "@type": "Review";
    author: { "@type": "Person"; name: string };
    reviewRating: { "@type": "Rating"; ratingValue: string };
    reviewBody: string;
  }> = [];

  if (reviewCount > 0) {
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("rating, title, body, guest_name, status")
      .eq("business_id", String(business.id))
      .in("status", ["published", "live"])
      .order("created_at", { ascending: false })
      .limit(3);

    jsonLdReviews = (Array.isArray(reviewRows) ? reviewRows : [])
      .map((row) => {
        const ratingValue = Number(
          (row as { rating?: number | null }).rating ?? 0
        );
        const body =
          String((row as { title?: string | null }).title ?? "").trim() ||
          String((row as { body?: string | null }).body ?? "").trim();
        if (!body) return null;
        return {
          "@type": "Review" as const,
          author: {
            "@type": "Person" as const,
            name:
              String((row as { guest_name?: string | null }).guest_name ?? "")
                .trim() || "Customer",
          },
          reviewRating: {
            "@type": "Rating" as const,
            ratingValue: String(
              ratingValue > 0 ? Math.min(5, Math.max(1, ratingValue)) : 5,
            ),
          },
          reviewBody: body,
        };
      })
      .filter((review): review is NonNullable<typeof review> => Boolean(review))
      .slice(0, 3);
  }

  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: (business as { name?: string | null }).name ?? "",
    url: `https://tellacity.com/b/${(business as { slug?: string | null }).slug ?? cleanSlug}`,
    ...(hasValidRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: averageRating,
            reviewCount: reviewCount,
          },
        }
      : {}),
    ...(jsonLdReviews.length > 0 ? { review: jsonLdReviews } : {}),
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
        initialPhotoSections={initialSections}
        initialIsClaimed={initialIsClaimed}
        initialPlanKey={initialPlanKey}
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
