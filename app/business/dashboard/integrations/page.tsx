"use client";

import IntegrationsOverview from "@/components/business/integrations/IntegrationsOverview";
import {
  getOverviewBuckets,
  normalizePlanId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { normalizePlanCodeToKey } from "@/lib/plans";
import { useBusinessContext } from "../_context/BusinessContext";
import { useConnectedIntegrationSlugs } from "../_hooks/useConnectedIntegrationSlugs";

export default function IntegrationsDashboardPage() {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const plan: PlanId = normalizePlanId(normalizePlanCodeToKey(selectedBusiness?.plan));
  const connectedSlugs = useConnectedIntegrationSlugs(businessId);

  if (!businessId) return null;

  const { connected, available, locked, enterprise } = getOverviewBuckets(
    plan,
    connectedSlugs,
  );

  return (
    <div className="space-y-6">
      <IntegrationsOverview
        plan={plan}
        businessId={businessId}
        connected={connected}
        available={available}
        locked={locked}
        enterprise={enterprise}
      />
    </div>
  );
}
