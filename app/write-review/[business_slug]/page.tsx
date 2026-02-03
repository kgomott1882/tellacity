\"use client\";

import { useParams } from \"next/navigation\";
import WriteReviewForm from \"@/components/reviews/WriteReviewForm\";

export default function WriteReviewPage() {
  const params = useParams<{ business_slug: string }>();
  const businessSlug = params?.business_slug ?? \"\";

  return (
    <WriteReviewForm
      initialBusinessSlug={businessSlug || null}
      initialBusinessId={null}
      initialBusinessName={null}
    />
  );
}

