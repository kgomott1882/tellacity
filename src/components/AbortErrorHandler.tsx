"use client";

import { useEffect } from "react";
import { isAbortError } from "@/lib/authErrors";

/**
 * Catches AbortError from unhandled promise rejections (e.g. Supabase auth lock timeout).
 * Prevents "Uncaught (in promise) AbortError" in the console.
 */
export default function AbortErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      if (isAbortError(reason)) {
        event.preventDefault();
        event.stopPropagation?.();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);
  return null;
}
