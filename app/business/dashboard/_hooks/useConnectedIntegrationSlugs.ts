"use client";

import { useEffect, useState } from "react";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import { useBusinessAuth } from "@/lib/useBusinessAuth";

/** Slugs from `/api/business/[id]/integrations-connected` (e.g. `shopify`). */
export function useConnectedIntegrationSlugs(businessId: string | null): string[] {
  const [slugs, setSlugs] = useState<string[]>([]);
  const { user, loading: authLoading } = useBusinessAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!businessId || !user?.id) {
      setSlugs([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const json = await dashboardApiGet<{ providers: string[] }>(
          `/api/business/${encodeURIComponent(businessId)}/integrations-connected`
        );
        if (!cancelled) setSlugs(json.providers ?? []);
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        if (message !== "Unauthorized" && message !== "Unauthorized.") {
          console.error("Failed to load connected integrations:", e);
        }
        if (!cancelled) setSlugs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, businessId, user?.id]);

  return slugs;
}
