import { Suspense } from "react";
import WriteReviewItemClient from "@/components/reviews/WriteReviewItemClient";

export const dynamic = "force-dynamic";

function LoadingFallback() {
  return (
    <main className="min-h-[40vh] bg-white px-4 py-16 text-center text-gray-600">Loading…</main>
  );
}

export default function WriteReviewItemPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WriteReviewItemClient />
    </Suspense>
  );
}
