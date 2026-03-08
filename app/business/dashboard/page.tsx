"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Business dashboard root: redirect to the default tab (Analytics).
 * Client-side redirect ensures the route always renders and avoids 404s
 * that can occur with server redirect() in some Next.js setups.
 */
export default function BusinessDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/business/dashboard/analytics/performance");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-neutral-500">Taking you to your dashboard…</p>
    </div>
  );
}
