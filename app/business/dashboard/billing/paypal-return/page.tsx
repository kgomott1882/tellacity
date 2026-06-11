import { Suspense } from "react";
import PayPalReturnClient from "./PayPalReturnClient";

export default function PayPalReturnPage() {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[#003087] border-t-transparent"
              role="status"
              aria-label="Loading"
            />
            <p className="mt-4 text-sm text-gray-600">Loading…</p>
          </div>
        }
      >
        <PayPalReturnClient />
      </Suspense>
    </div>
  );
}
