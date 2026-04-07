"use client";

import { useSearchParams } from "next/navigation";
import WriteReviewForm from "@/components/reviews/WriteReviewForm";
import WriteReviewSuccessView from "../WriteReviewSuccessView";

type Props = {
  businessSlug: string;
};

function parseRatingQuery(value: string | null): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1 || n > 5) return undefined;
  return n;
}

export default function WriteReviewSlugClient({ businessSlug }: Props) {
  const searchParams = useSearchParams();
  const s = searchParams.get("success");
  const isSuccess = s === "1" || s === "review_submitted";

  if (isSuccess) {
    return <WriteReviewSuccessView />;
  }

  const initialRating = parseRatingQuery(searchParams.get("rating"));

  return (
    <WriteReviewForm
      inviteId={null}
      inviteToken={undefined}
      businessSlug={businessSlug}
      initialBusinessId={null}
      initialBusinessSlug={businessSlug}
      initialBusinessName={null}
      initialRating={initialRating}
    />
  );
}
