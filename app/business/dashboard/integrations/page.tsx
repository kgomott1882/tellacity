"use client";

import { useEffect, useState } from "react";
import IntegrationsOverview from "@/components/business/integrations/IntegrationsOverview";
import {
  getOverviewBuckets,
  normalizePlanId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useBusinessContext } from "../_context/BusinessContext";

export default function IntegrationsDashboardPage() {
  const { selectedBusiness } = useBusinessContext();
  const plan: PlanId = normalizePlanId(selectedBusiness?.plan);
  const [connectedSlugs, setConnectedSlugs] = useState<string[]>([]);

  useEffect(() => {
    const businessId = selectedBusiness?.id;
    if (!businessId) {
      setConnectedSlugs([]);
      return;
    }
    const supabase = supabaseBrowser();
    supabase
      .from("business_integrations_v1")
      .select("provider")
      .eq("business_id", businessId)
      .then(({ data }) => {
        setConnectedSlugs((data ?? []).map((r) => String(r.provider ?? "")));
      });
  }, [selectedBusiness?.id]);

  const { connected, available, locked, enterprise } = getOverviewBuckets(
    plan,
    connectedSlugs,
  );

  return (
    <IntegrationsOverview
      plan={plan}
      businessId={selectedBusiness?.id ?? null}
      connected={connected}
      available={available}
      locked={locked}
      enterprise={enterprise}
    />
  );
}

