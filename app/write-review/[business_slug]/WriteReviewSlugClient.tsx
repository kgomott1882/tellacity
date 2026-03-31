"use client";

import { useSearchParams } from "next/navigation";
import WriteReviewForm from "@/components/reviews/WriteReviewForm";
import WriteReviewSuccessView from "../WriteReviewSuccessView";

type Props = {
  businessSlug: string;
};

export default function WriteReviewSlugClient({ businessSlug }: Props) {
  const searchParams = useSearchParams();
  const s = searchParams.get("success");
  const isSuccess = s === "1" || s === "review_submitted";

  if (isSuccess) {
    return <WriteReviewSuccessView />;
  }

  return (
    <WriteReviewForm
      inviteId={null}
      inviteToken={undefined}
      businessSlug={businessSlug}
      initialBusinessId={null}
      initialBusinessSlug={businessSlug}
      initialBusinessName={null}
    />
  );
}
