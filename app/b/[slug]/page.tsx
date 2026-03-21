import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BusinessClient from "@/components/business/BusinessClient";
import SimilarBusinessLogo from "@/components/business/SimilarBusinessLogo";
import { normalizeLogoUrl, similarBusinessLogoUrl } from "@/lib/logo";
import { sanitizeText } from "@/lib/sanitizeText";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase env missing for business page");
  }

  return createClient(url, key);
}

function getSafeSlug(slug: string): string | null {
  if (!slug || typeof slug !== "string") return null;
  const safeSlug = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(safeSlug) ? safeSlug : null;
}

async function resolveBusinessBySlug(supabase: ReturnType<typeof getSupabase>, safeSlug: string) {
  const fetchBySlug = async (candidate: string) => {
    const { data } = await supabase.rpc("get_business_by_slug", {
      p_slug: candidate,
    });
    return Array.isArray(data) ? data[0] : data;
  };

  const exact = await fetchBySlug(safeSlug);
  if (exact) return exact;

  // Fallback for copied/share links with numeric suffixes (e.g. brand-2).
  const baseSlug = safeSlug.replace(/-\d+$/, "");
  if (baseSlug && baseSlug !== safeSlug) {
    const baseMatch = await fetchBySlug(baseSlug);
    if (baseMatch) return baseMatch;
  }

  // Last fallback: pick closest active business slug by prefix.
  const prefix = (baseSlug || safeSlug).trim();
  if (prefix) {
    const { data: nearest } = await supabase
      .from("businesses")
      .select("slug")
      .eq("status", "active")
      .ilike("slug", `${prefix}%`)
      .order("review_count", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const nearestSlug = getSafeSlug(String(nearest?.slug ?? ""));
    if (nearestSlug) {
      return await fetchBySlug(nearestSlug);
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const safeSlug = getSafeSlug(slug);

  if (!safeSlug) {
    return {
      title: "Business Not Found | Tellacity",
    };
  }

  const supabase = getSupabase();

  const business = await resolveBusinessBySlug(supabase, safeSlug);

  if (!business) {
    return {
      title: "Business Not Found | Tellacity",
    };
  }

  const title = `${sanitizeText(business.name)} Reviews | Customer Reviews & Ratings | Tellacity`;

  const description = `Read verified customer reviews of ${sanitizeText(business.name)}. See ratings, feedback and real experiences from customers on Tellacity.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://tellacity.com/b/${safeSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://tellacity.com/b/${safeSlug}`,
      type: "website",
    },
  };
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const safeSlug = getSafeSlug(slug);
  if (!safeSlug) {
    return <BusinessClient />;
  }
  const supabase = getSupabase();

  const business = await resolveBusinessBySlug(supabase, safeSlug);

  if (!business) {
    return <BusinessClient />;
  }

  const resolvedSlug = getSafeSlug(String(business.slug ?? ""));
  if (resolvedSlug && resolvedSlug !== safeSlug) {
    redirect(`/b/${resolvedSlug}`);
  }

  const { data: reviewSchema } = await supabase
    .from("review_schema_data")
    .select("*")
    .eq("business_slug", business.slug)
    .limit(5);

  const safeCategorySlug = getSafeSlug(String(business.category_slug ?? ""));
  const safeCountryCode = String(business.country_code ?? "").trim().toUpperCase();
  const currentBusinessId = String(business.id ?? "").trim();

  const { data: relatedRows } =
    safeCategorySlug && safeCountryCode
      ? await supabase
          .from("businesses")
          .select(
            "id, slug, name, trust_score, review_count, logo_url, resolved_logo_url, website, website_display"
          )
          .eq("status", "active")
          .eq("category_slug", safeCategorySlug)
          .eq("country_code", safeCountryCode)
          .neq("id", currentBusinessId)
          .not("slug", "is", null)
          .order("trust_score", { ascending: false, nullsFirst: false })
          .limit(8)
      : {
          data: [] as Array<{
            id?: string | null;
            slug?: string | null;
            name?: string | null;
            trust_score?: number | null;
            review_count?: number | null;
            logo_url?: string | null;
            resolved_logo_url?: string | null;
            website?: string | null;
            website_display?: string | null;
          }>,
        };

  const relatedBusinesses = (Array.isArray(relatedRows) ? relatedRows : [])
    .map((row) => {
      const rowSlug = getSafeSlug(String(row.slug ?? ""));
      if (!rowSlug || rowSlug === safeSlug) return null;
      return {
        id: String(row.id ?? rowSlug),
        slug: rowSlug,
        name: String(row.name ?? "").trim() || "Business",
        trustScore:
          typeof row.trust_score === "number" ? row.trust_score.toFixed(1) : null,
        reviewCount:
          typeof row.review_count === "number" ? row.review_count : null,
        logoUrl: similarBusinessLogoUrl(row),
      };
    })
    .filter(
      (
        row
      ): row is {
        id: string;
        slug: string;
        name: string;
        trustScore: string | null;
        reviewCount: number | null;
        logoUrl: string | null;
      } => Boolean(row)
    )
    .slice(0, 8);

  const reviewObjects =
    reviewSchema?.map(
      (review: {
        reviewer_name: string;
        rating: number;
        body: string;
        created_at: string;
      }) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: review.reviewer_name,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
        },
        reviewBody: review.body,
        datePublished: review.created_at,
      })
    ) ?? [];

  const hasReviews = reviewObjects.length > 0;
  const categoryName = String(business.category_name ?? "").trim();

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: sanitizeText(business.name),
    url: `https://tellacity.com/b/${business.slug}`,
    ...(business.website ? { sameAs: business.website } : {}),
    ...(hasReviews &&
    business.review_count != null &&
    Number(business.review_count) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: business.average_rating ?? business.trust_score,
            reviewCount: business.review_count,
          },
        }
      : {}),
    ...(hasReviews ? { review: reviewObjects } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {safeCategorySlug && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600">
            Category:{" "}
            <Link
              href={`/categories/${safeCategorySlug}`}
              className="font-medium text-[#124541] hover:underline"
            >
              {sanitizeText(categoryName || safeCategorySlug.replace(/-/g, " "))}
            </Link>
          </p>
        </div>
      )}
      <BusinessClient initialBusiness={business} />
      {relatedBusinesses.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">Similar businesses</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedBusinesses.map((item) => (
              <Link
                key={item.id}
                href={`/b/${item.slug}`}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition hover:border-[#1FAF9E] hover:bg-[#F8FFFE]"
              >
                <SimilarBusinessLogo
                  logoUrl={item.logoUrl}
                  nameForAlt={sanitizeText(item.name)}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0E0E0E]">{sanitizeText(item.name)}</p>
                  {(item.trustScore || item.reviewCount !== null) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {item.trustScore ? `TrustScore ${item.trustScore}` : "Unrated"}
                      {item.reviewCount !== null
                        ? ` · ${item.reviewCount.toLocaleString("en-US")} reviews`
                        : ""}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}