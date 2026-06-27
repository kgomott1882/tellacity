import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  FEATURE_SLUGS,
  getFeatureBySlug,
} from "../../forBusinessFeaturesData";
import ForBusinessFeatureDetailClient from "./ForBusinessFeatureDetailClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return FEATURE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const feature = getFeatureBySlug(slug);
  if (!feature) {
    return { title: "Feature not found | Tellacity" };
  }

  const url = `https://tellacity.com/for-business/features/${feature.slug}`;

  return {
    title: `${feature.title} | Tellacity for Business`,
    description: feature.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${feature.title} | Tellacity for Business`,
      description: feature.metaDescription,
      url,
      siteName: "Tellacity",
      type: "website",
      images: [{ url: feature.image }],
    },
    robots: { index: true, follow: true },
  };
}

export default async function ForBusinessFeaturePage(props: PageProps) {
  const { slug } = await props.params;
  const feature = getFeatureBySlug(slug);
  if (!feature) notFound();

  const pageUrl = `https://tellacity.com/for-business/features/${feature.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: feature.title,
    description: feature.metaDescription,
    url: pageUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://tellacity.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "For Business",
          item: "https://tellacity.com/for-business",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: feature.title,
          item: pageUrl,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ForBusinessFeatureDetailClient feature={feature} />
    </>
  );
}
