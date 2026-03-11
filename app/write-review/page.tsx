import { Suspense } from "react";
import WriteReviewPageInner from "./WriteReviewPageInner";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function WriteReviewPage() {
  return (
    <Suspense fallback={null}>
      <WriteReviewPageInner />
    </Suspense>
  );
}

