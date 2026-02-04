"use client";

import { Suspense } from "react";
import WriteReviewPageInner from "./WriteReviewPageInner";

export const dynamic = "force-dynamic";

export default function WriteReviewPage() {
  return (
    <Suspense fallback={null}>
      <WriteReviewPageInner />
    </Suspense>
  );
}

