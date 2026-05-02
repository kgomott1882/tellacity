"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import WriteReviewItemContent from "@/components/reviews/WriteReviewItemContent";

function WriteReviewItemBody() {
  const searchParams = useSearchParams();
  const slug = (searchParams.get("businessSlug") || searchParams.get("slug") || "").trim();
  const photoId = (searchParams.get("photoId") || "").trim();

  if (!slug || !photoId) {
    return (
      <main className="mx-auto max-w-lg bg-white px-4 py-16">
        <p className="text-gray-800">Missing business or photo.</p>
      </main>
    );
  }

  return <WriteReviewItemContent businessSlug={slug} photoId={photoId} variant="page" />;
}

export default function WriteReviewItemClient() {
  return (
    <Suspense fallback={<main className="min-h-[40vh] bg-white px-4 py-16 text-center text-gray-600">Loading…</main>}>
      <WriteReviewItemBody />
    </Suspense>
  );
}
