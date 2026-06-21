import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import type { BusinessPhotoPublic } from "@/lib/businessPhotosDisplay";
import {
  createPlanResolutionAdminClient,
  loadPublicBusinessPhotosForDisplay,
} from "@/lib/loadPublicBusinessPhotos";
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

  const planAdmin = createPlanResolutionAdminClient();
  const initialBusinessPhotos: BusinessPhotoPublic[] =
    await loadPublicBusinessPhotosForDisplay({
      supabase,
      planAdmin,
      businessId: String(business.id),
    });

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
