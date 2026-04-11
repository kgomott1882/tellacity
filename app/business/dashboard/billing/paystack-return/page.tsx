import { Suspense } from "react";
import PaystackReturnClient from "./PaystackReturnClient";

export default function PaystackReturnPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
              role="status"
              aria-label="Loading"
            />
            <p className="mt-4 text-sm text-gray-600">Loading…</p>
          </div>
        }
      >
        <PaystackReturnClient />
      </Suspense>
    </div>
  );
}
