"use client";

import IntegrationsOverview from "@/components/business/integrations/IntegrationsOverview";
import {
  getOverviewBuckets,
  normalizePlanId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { useBusinessContext } from "../_context/BusinessContext";

export default function IntegrationsDashboardPage() {
  const { selectedBusiness } = useBusinessContext();
  const plan: PlanId = normalizePlanId(selectedBusiness?.plan);

  // In a future phase, this will be populated from Supabase connection records.
  const connectedSlugs: string[] = [];

  const { connected, available, locked, enterprise } = getOverviewBuckets(
    plan,
    connectedSlugs,
  );

  return (
    <IntegrationsOverview
      plan={plan}
      connected={connected}
      available={available}
      locked={locked}
      enterprise={enterprise}
    />
  );
}

