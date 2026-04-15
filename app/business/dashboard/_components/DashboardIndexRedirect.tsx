"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client navigation to the default workspace route. Used instead of server
 * `redirect()` from the dashboard index so Turbopack/React dev profiling does not
 * hit a known `performance.measure` negative-timestamp bug on redirect-only pages.
 */
export default function DashboardIndexRedirect() {
  const router = useRouter();
  useLayoutEffect(() => {
    router.replace("/business/dashboard/analytics/performance");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
      Opening dashboard…
    </div>
  );
}
