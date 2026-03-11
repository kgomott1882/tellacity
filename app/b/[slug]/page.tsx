import { createClient } from "@supabase/supabase-js";
import BusinessClient from "@/components/business/BusinessClient";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing for business page");
  }
  return createClient(url, key);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabase();
  const { data } = await supabase.rpc("get_business_by_slug", {
    p_slug: slug,
  });

  const business = Array.isArray(data) ? data[0] : data;

  if (!business) {
    return {
      title: "Business Not Found | Tellacity",
    };
  }

  return {
    title: `${business.name} Reviews | Tellacity`,
    description: `Read customer reviews about ${business.name}. Discover ratings, feedback and insights on Tellacity.`,
    alternates: {
      canonical: `https://tellacity.com/b/${business.slug}`,
    },
    openGraph: {
      title: `${business.name} Reviews | Tellacity`,
      description: `Read customer reviews about ${business.name}.`,
      url: `https://tellacity.com/b/${business.slug}`,
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
  const supabase = getSupabase();
  const { data } = await supabase.rpc("get_business_by_slug", {
    p_slug: slug,
  });

  const business = Array.isArray(data) ? data[0] : data;

    if (!business) {
    return <BusinessClient />;
  }

  const { data: reviewSchema } = await supabase
    .from("review_schema_data")
    .select("*")
    .eq("business_slug", business.slug)
    .limit(5);

  const reviewObjects =
    reviewSchema?.map((review: { reviewer_name: string; rating: number; body: string; created_at: string }) => ({
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
    })) ?? [];

  const hasReviews = reviewObjects.length > 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url: `https://tellacity.com/b/${business.slug}`,
    ...(business.website ? { sameAs: business.website } : {}),
    ...(hasReviews && business.review_count != null && Number(business.review_count) > 0
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
      <BusinessClient initialBusiness={business} />
    </>
  );
}
