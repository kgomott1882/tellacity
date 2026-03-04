import WriteReviewForm from "@/components/reviews/WriteReviewForm";

export default function WriteReviewPage({
  params,
}: {
  params: { business_slug: string };
}) {
  const slug = params.business_slug;

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
