"use client";

import { useEffect, useState } from "react";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";

/** Slugs from `/api/business/[id]/integrations-connected` (e.g. `shopify`). */
export function useConnectedIntegrationSlugs(businessId: string | null): string[] {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!businessId) {
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
        console.error("Failed to load connected integrations:", e);
        if (!cancelled) setSlugs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return slugs;
}
