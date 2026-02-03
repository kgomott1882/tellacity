"use client";

import { useEffect } from "react";

/**
 * Catches AbortError from unhandled promise rejections (e.g. Supabase auth lock timeout).
 * Prevents "Uncaught (in promise) AbortError" in the console.
 */
export default function AbortErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const e = event?.reason;
      if (e != null && typeof e === "object" && (e as { name?: string }).name === "AbortError") {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return null;
}
