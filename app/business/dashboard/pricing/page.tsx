"use client";

import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import { useBusinessContext } from "../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";

/**
 * Full pricing UI inside the dashboard shell. "Choose This Plan" opens Paystack
 * for paid tiers (same flow as Plans & billing), not the public signup flow.
 */
export default function DashboardPricingPage() {
  const { selectedBusiness, isLoading } = useBusinessContext();
  const { user } = useBusinessAuth();

  if (isLoading) {
    return (
      <div className="w-full min-h-[40vh] space-y-4">
        <div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-gray-200" />
        <div className="h-6 w-full max-w-xl animate-pulse rounded bg-gray-100" />
        <div className="h-48 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  return (
    <PricingPageContent
      variant="dashboard"
      dashboardBusinessId={selectedBusiness?.id ?? ""}
      dashboardUserEmail={user?.email ?? ""}
    />
  );
}
