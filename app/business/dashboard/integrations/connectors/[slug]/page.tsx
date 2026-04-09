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
import { normalizePlanCodeToKey } from "@/lib/plans";
import { useBusinessContext } from "../../../_context/BusinessContext";
import { useConnectedIntegrationSlugs } from "../../../_hooks/useConnectedIntegrationSlugs";

export default function IntegrationConnectorDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;

  const businessId = selectedBusiness.id;
  const plan: PlanId = normalizePlanId(normalizePlanCodeToKey(selectedBusiness?.plan));

  const integration = getIntegrationBySlug(slug);

  const connectedSlugs = useConnectedIntegrationSlugs(businessId);

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

  const connectHref =
    state === "available"
      ? integration.slug === "shopify"
        ? `/business/dashboard/integrations/connect-shopify?business_id=${encodeURIComponent(businessId)}`
        : integration.slug === "woocommerce"
          ? `/business/dashboard/integrations/connect-woocommerce?business_id=${encodeURIComponent(businessId)}`
          : null
      : null;

  return (
    <IntegrationDetailView
      integration={integration}
      category={category}
      state={state}
      plan={plan}
      connectHref={connectHref}
    />
  );
}

