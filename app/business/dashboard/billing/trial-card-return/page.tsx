import { Suspense } from "react";
import TrialCardReturnClient from "./TrialCardReturnClient";

export default function TrialCardReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
          <p className="text-sm text-gray-600">Loading…</p>
        </div>
      }
    >
      <TrialCardReturnClient />
    </Suspense>
  );
}
