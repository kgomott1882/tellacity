"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import { useBusinessContext } from "../_context/BusinessContext";

const ANALYTICS_PATH = "/business/dashboard/analytics/performance";
const INVITE_PATH = "/business/dashboard/get-reviews/overview#send-invite";

/**
 * Client navigation to the default workspace route. Used instead of server
 * `redirect()` from the dashboard index so Turbopack/React dev profiling does not
 * hit a known `performance.measure` negative-timestamp bug on redirect-only pages.
 *
 * Un-activated businesses (no sent review invites) land on the invite page;
 * activated businesses keep the analytics default.
 */
export default function DashboardIndexRedirect() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const redirectedRef = useRef(false);

  useLayoutEffect(() => {
    if (redirectedRef.current) return;

    const businessId = selectedBusiness?.id;
    if (!businessId) return;

    let cancelled = false;

    void (async () => {
      let target = INVITE_PATH;

      try {
        const json = await dashboardApiGet<{ items?: unknown[] }>(
          `/api/review-invites/sent?businessId=${encodeURIComponent(businessId)}&limit=1`
        );
        if (cancelled || redirectedRef.current) return;
        target = (json.items?.length ?? 0) > 0 ? ANALYTICS_PATH : INVITE_PATH;
      } catch {
        if (cancelled || redirectedRef.current) return;
        // Prefer invite page when activation status is unknown (better for new users).
        target = INVITE_PATH;
      }

      redirectedRef.current = true;
      router.replace(target);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, selectedBusiness?.id]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
      Opening dashboard…
    </div>
  );
}
