import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SolutionFeaturePageLayout from "@/components/solutions/SolutionFeaturePageLayout";
import {
  REVIEW_INVITATION_FEATURE_SLUGS,
  getReviewInvitationFeature,
  getReviewInvitationFeaturePath,
} from "@/lib/solutions/reviewInvitationFeatures";

type PageProps = {
  params: Promise<{ feature: string }>;
};

export function generateStaticParams() {
  return REVIEW_INVITATION_FEATURE_SLUGS.map((feature) => ({ feature }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { feature } = await params;
  const content = getReviewInvitationFeature(feature);
  if (!content) {
    return { title: "Not found | Tellacity" };
  }

  const url = `https://tellacity.com${getReviewInvitationFeaturePath(content.slug)}`;

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url,
      siteName: "Tellacity",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: content.metaTitle,
      description: content.metaDescription,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ReviewInvitationFeaturePage({ params }: PageProps) {
  const { feature } = await params;
  const content = getReviewInvitationFeature(feature);
  if (!content) {
    notFound();
  }

  return <SolutionFeaturePageLayout content={content} />;
}
