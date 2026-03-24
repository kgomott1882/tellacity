"use client";

import { useParams } from "next/navigation";
import IntegrationSection from "@/components/business/integrations/IntegrationSection";
import {
  getCategoryById,
  getIntegrationsForCategory,
  normalizePlanId,
  type IntegrationCategoryId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { useBusinessContext } from "../../_context/BusinessContext";

export default function IntegrationsCategoryPage() {
  const params = useParams<{ category: string }>();
  const rawCategory = params?.category ?? "";
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;

  const plan: PlanId = normalizePlanId(selectedBusiness?.plan);
  const category = getCategoryById(rawCategory);

  // In a future phase this will be populated from Supabase connection records.
  const connectedSlugs: string[] = [];

  if (!category) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Integrations</h1>
        <p className="mt-2 text-sm text-gray-600">
          This integrations category could not be found.
        </p>
      </div>
    );
  }

  const integrations = getIntegrationsForCategory(
    category.id as IntegrationCategoryId,
    plan,
    connectedSlugs,
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <header className="border-b border-gray-100 pb-4">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">
          {category.label}
        </h1>
        <p className="mt-1 text-sm text-gray-600">{category.description}</p>
      </header>

      <IntegrationSection
        title="Integrations in this category"
        integrations={integrations}
        emptyLabel="No integrations are available in this category yet."
      />
    </div>
  );
}

