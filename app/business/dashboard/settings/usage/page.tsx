"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import {
  parseBillingCycleQuery,
  parseBillingPlanQuery,
  isPaidPlanForConfirm,
} from "@/lib/billingPlanConfirm";
import { normalizePlanCodeToKey } from "@/lib/plans";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { useBusinessContext } from "../../_context/BusinessContext";
import SimplePage from "../../_components/SimplePage";

export default function UsageSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();

  const businessId = selectedBusiness?.id ?? null;
  const currentPlanKey = normalizePlanCodeToKey(selectedBusiness?.plan);
  const dashboardEmail = user?.email?.trim() ?? "";

  const parsedCheckoutPlan = parseBillingPlanQuery(searchParams.get("plan") ?? undefined);
  const parsedCycle = parseBillingCycleQuery(searchParams.get("cycle") ?? undefined);
  const upgrade = (() => {
    const v = (searchParams.get("upgrade") ?? "").trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  })();

  useEffect(() => {
    if (!upgrade || !parsedCheckoutPlan || !isPaidPlanForConfirm(parsedCheckoutPlan)) return;
    const qs = new URLSearchParams({
      plan: parsedCheckoutPlan,
      cycle: parsedCycle,
    });
    router.replace(`/business/dashboard/billing/checkout?${qs.toString()}`);
  }, [upgrade, parsedCheckoutPlan, parsedCycle, router]);

  if (!businessId) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div className="max-w-2xl space-y-3">
        <SimplePage
          title="Pricing Plans"
          subtitle="Compare plans, switch billing cadence, and choose the best fit for your workspace."
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-[#0E0E0E]">Subscription options</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review pricing, compare plans, and upgrade when your workspace needs more capacity.
          </p>
        </div>

        <div className="mt-6">
          <PricingPageContent
            variant="dashboard"
            dashboardBusinessId={businessId}
            dashboardUserEmail={dashboardEmail}
            dashboardCurrentPlanKey={currentPlanKey}
            embedInDashboard
            dashboardHideMarketingHero
            dashboardInitialBillingMode={parsedCycle}
          />
        </div>
      </section>
    </div>
  );
}
