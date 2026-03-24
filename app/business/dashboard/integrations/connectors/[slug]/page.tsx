"use client";

import { useParams } from "next/navigation";
import IntegrationDetailView from "@/components/business/integrations/IntegrationDetailView";
import {
  getCategoryById,
  getIntegrationBySlug,
  deriveIntegrationState,
  normalizePlanId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { useBusinessContext } from "../../../_context/BusinessContext";

export default function IntegrationConnectorDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;

  const plan: PlanId = normalizePlanId(selectedBusiness?.plan);

  const integration = getIntegrationBySlug(slug);

  // In a future phase this will be populated from Supabase connection records.
  const connectedSlugs: string[] = [];

  if (!integration) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">
          Integration not found
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          The requested integration does not exist or has not been enabled in this
          workspace.
        </p>
      </div>
    );
  }

  const category =
    getCategoryById(integration.categoryId) ??
    ({
      id: integration.categoryId,
      label: "Integrations",
      description: "",
    } as const);

  const state = deriveIntegrationState(integration, plan, connectedSlugs);

  return (
    <IntegrationDetailView
      integration={integration}
      category={category}
      state={state}
      plan={plan}
    />
  );
}

