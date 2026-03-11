export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

import WriteReviewForm from "@/components/reviews/WriteReviewForm";

export default async function WriteReviewPage({
  params,
}: {
  params: Promise<{ business_slug: string }>;
}) {
  const { business_slug: slug } = await params;

  return (
    <WriteReviewForm
      inviteId={null}
      inviteToken={undefined}
      businessSlug={slug}
      initialBusinessId={null}
      initialBusinessSlug={slug}
      initialBusinessName={null}
    />
  );
}
