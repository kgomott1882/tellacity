"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import ArticleSubmitPricingBanner from "@/components/articles/editor/ArticleSubmitPricingBanner";
import {
  BILLING_UPGRADE_SESSION_KEY,
  isUpgradeFlowContext,
  readUpgradeSourceFromSearchParams,
} from "@/lib/upgradeFlow";
import {
  parseBillingCycleQuery,
  parseBillingPlanQuery,
  isPaidPlanForConfirm,
} from "@/lib/billingPlanConfirm";
import { stashBillingCheckoutBackPath } from "@/lib/billingCheckoutBack";
import { billingCheckoutPickerPath } from "@/lib/billingCheckoutPaths";
import { normalizePlanCodeToKey } from "@/lib/plans";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { useBusinessContext } from "../../_context/BusinessContext";
import SimplePage from "../../_components/SimplePage";

export default function UsageSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBusiness, bumpNavRefresh } = useBusinessContext();
  const { user } = useBusinessAuth();

  const [pricingHighlightContext, setPricingHighlightContext] = useState<
    "upload_limit" | "section_locked" | null
  >(null);

  const businessId = selectedBusiness?.id ?? null;
  const currentPlanKey = normalizePlanCodeToKey(selectedBusiness?.plan);
  const trialEligible = selectedBusiness?.trialEligible === true;
  const dashboardEmail = user?.email?.trim() ?? "";

  const parsedCheckoutPlan = parseBillingPlanQuery(searchParams.get("plan") ?? undefined);
  const parsedCycle = parseBillingCycleQuery(searchParams.get("cycle") ?? undefined);
  const articleSubmitSource = searchParams.get("source");
  const articleSubmitIntent = searchParams.get("intent");
  const upgrade = (() => {
    const v = (searchParams.get("upgrade") ?? "").trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  })();

  useEffect(() => {
    if (!upgrade || !parsedCheckoutPlan || !isPaidPlanForConfirm(parsedCheckoutPlan)) return;
    const returnTo = "/business/dashboard/settings/usage";
    stashBillingCheckoutBackPath(returnTo);
    router.replace(
      billingCheckoutPickerPath(parsedCheckoutPlan, parsedCycle, returnTo)
    );
  }, [upgrade, parsedCheckoutPlan, parsedCycle, router]);

  useEffect(() => {
    const q = readUpgradeSourceFromSearchParams(searchParams);
    if (isUpgradeFlowContext(q) && (q === "upload_limit" || q === "section_locked")) {
      setPricingHighlightContext(q);
      return;
    }
    if (typeof window !== "undefined") {
      try {
        const s = window.sessionStorage.getItem(BILLING_UPGRADE_SESSION_KEY);
        if (isUpgradeFlowContext(s) && (s === "upload_limit" || s === "section_locked")) {
          setPricingHighlightContext(s);
          return;
        }
      } catch {
        // ignore
      }
    }
    setPricingHighlightContext(null);
  }, [searchParams]);

  if (!businessId) return null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <ArticleSubmitPricingBanner
        businessId={businessId}
        currentPlanKey={currentPlanKey}
        source={articleSubmitSource}
        intentFromQuery={articleSubmitIntent}
      />

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
            dashboardTrialEligible={trialEligible}
            onTrialStarted={bumpNavRefresh}
            dashboardPricingHighlightContext={pricingHighlightContext}
            embedInDashboard
            dashboardHideMarketingHero
            dashboardInitialBillingMode={parsedCycle}
          />
        </div>
      </section>
    </div>
  );
}
