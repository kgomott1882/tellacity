"use client";

import { useEffect } from "react";

/**
 * Shown after a successful authenticated / Google review submission
 * (?success=1 or legacy ?success=review_submitted). Keeps the form from re-rendering underneath.
 */
export default function WriteReviewSuccessView() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white">
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="absolute right-3 top-3 text-gray-400 hover:text-black"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-2 text-xl font-semibold text-[#0E0E0E]">Thank you</h2>
        <p className="text-gray-600">
          Your review has been published successfully.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          className="mt-4 text-sm font-medium text-[#1FAF9E] hover:underline"
        >
          Go to homepage
        </button>
      </div>
    </div>
    </main>
  );
}
