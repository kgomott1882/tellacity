import { Suspense } from "react";
import WriteReviewSlugClient from "./WriteReviewSlugClient";

export const metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug: slug } = await params;

  return (
    <Suspense fallback={null}>
      <WriteReviewSlugClient businessSlug={slug} />
    </Suspense>
  );
}
