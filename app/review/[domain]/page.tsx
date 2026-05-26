import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { buildBusinessLocalBusinessJsonLd } from "@/lib/businessReviewJsonLd";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

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
      .select("id, url, section, created_at, is_cover, sort_order, status, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url")
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
    }))
    .filter((photo) => photo.id && photo.url);

  const initialIsClaimed = Boolean(
    (business as { owner_id?: string | null }).owner_id
  );

  const businessJsonLd = await buildBusinessLocalBusinessJsonLd(supabase, {
    businessId: String(business.id),
    name: String((business as { name?: string | null }).name ?? ""),
    url: `https://tellacity.com/review/${normalizedDomain}`,
  });

  return (
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
}
