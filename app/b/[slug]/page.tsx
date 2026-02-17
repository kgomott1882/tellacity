import { createClient } from "@supabase/supabase-js";
import BusinessClient from "@/components/business/BusinessClient";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabase.rpc("get_business_by_slug", {
    p_slug: params.slug,
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

export default async function BusinessPage({ params }: { params: { slug: string } }) {
  const { data } = await supabase.rpc("get_business_by_slug", {
    p_slug: params.slug,
  });

  const business = Array.isArray(data) ? data[0] : data;

    if (!business) {
    return <BusinessClient />;
  }

  const jsonLd = {
          "@context": "https://schema.org",
    "@type": "Organization",
          name: business.name,
    url: `https://tellacity.com/b/${business.slug}`,
    ...(business.review_count != null &&
    Number(business.review_count) > 0 &&
    business.trust_score != null
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
            ratingValue: business.trust_score,
            reviewCount: business.review_count,
            bestRating: 5,
                },
              }
            : {}),
  };

  return (
    <>
        <script
          type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessClient initialBusiness={business} />
    </>
  );
}
