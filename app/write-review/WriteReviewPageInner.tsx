"use client";

import { useSearchParams } from "next/navigation";
import WriteReviewForm from "@/components/reviews/WriteReviewForm";

export default function WriteReviewLandingPage() {
  const searchParams = useSearchParams();

  const inviteId = searchParams.get("inviteId");
  const inviteToken = searchParams.get("inviteToken");
  const businessId =
    searchParams.get("businessId") || searchParams.get("business_id");
  const businessName = searchParams.get("businessName");
  const initialBusinessSlug = searchParams.get("businessSlug");

  return (
    <WriteReviewForm
      inviteId={inviteId}
      inviteToken={inviteToken ?? undefined}
      businessSlug={initialBusinessSlug ?? ""}
      initialBusinessId={businessId}
      initialBusinessSlug={null}
      initialBusinessName={businessName}
    />
  );
}

