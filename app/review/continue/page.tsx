"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PENDING_REVIEW_DRAFT_ID_KEY = "pendingReviewDraftId";

export default function ContinueReviewPage() {
  const router = useRouter();

  useEffect(() => {
    const draftId =
      typeof window !== "undefined"
        ? window.localStorage.getItem(PENDING_REVIEW_DRAFT_ID_KEY)
        : null;

    if (!draftId) {
      router.replace("/");
      return;
    }

    router.replace(`/write-review?draft_id=${encodeURIComponent(draftId)}`);
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4F0] px-4">
      <p className="text-sm text-neutral-600">Loading your review…</p>
    </main>
  );
}
