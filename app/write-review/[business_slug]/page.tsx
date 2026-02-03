import WriteReviewForm from "@/components/reviews/WriteReviewForm";

export default function WriteReviewPage({
  params,
}: {
  params: { business_slug: string };
}) {
  return <WriteReviewForm businessSlug={params.business_slug} />;
}
