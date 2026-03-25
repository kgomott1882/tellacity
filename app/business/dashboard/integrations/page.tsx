"use client";

import { useEffect, useState } from "react";
import IntegrationsOverview from "@/components/business/integrations/IntegrationsOverview";
import {
  getOverviewBuckets,
  normalizePlanId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { normalizePlanCodeToKey } from "@/lib/plans";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import { useBusinessContext } from "../_context/BusinessContext";

export default function IntegrationsDashboardPage() {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const plan: PlanId = normalizePlanId(normalizePlanCodeToKey(selectedBusiness?.plan));
  const [connectedSlugs, setConnectedSlugs] = useState<string[]>([]);

  useEffect(() => {
    if (!businessId) {
      setConnectedSlugs([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const json = await dashboardApiGet<{ providers: string[] }>(
          `/api/business/${encodeURIComponent(businessId)}/integrations-connected`
        );
        if (!cancelled) setConnectedSlugs(json.providers ?? []);
      } catch (error) {
        console.error("Failed to load integrations:", error);
        if (!cancelled) setConnectedSlugs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!businessId) return null;

  const { connected, available, locked, enterprise } = getOverviewBuckets(
    plan,
    connectedSlugs,
  );

  return (
    <IntegrationsOverview
      plan={plan}
      businessId={businessId}
      connected={connected}
      available={available}
      locked={locked}
      enterprise={enterprise}
    />
  );
}
