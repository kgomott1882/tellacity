"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import SimplePage from "../_components/SimplePage";
import { useBusinessContext } from "../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import {
  normalizePlanCodeToKey,
  nextTierUpgradeCtaLabel,
  type PlanKey,
} from "@/lib/plans";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

const PRICING_SCROLL_REASONS = new Set(["limit", "analytics", "widget", "team"]);

export default function BillingPage() {
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const pricingSectionRef = useRef<HTMLElement | null>(null);

  const businessId = selectedBusiness?.id ?? null;
  const planKey = normalizePlanCodeToKey(selectedBusiness?.plan);
  const shouldScrollToPricing =
    Boolean(businessId) && reason != null && PRICING_SCROLL_REASONS.has(reason);
  const emphasizePremiumAnchor = shouldScrollToPricing;

  useEffect(() => {
    if (!shouldScrollToPricing || !pricingSectionRef.current) return;
    const id = window.requestAnimationFrame(() => {
      pricingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [shouldScrollToPricing]);

  if (!businessId || !selectedBusiness) return null;

  const planLabel = PLAN_LABELS[planKey] ?? PLAN_LABELS.free;
  const upgradeCta = nextTierUpgradeCtaLabel(planKey);

  const reasonMessage =
    reason === "limit"
      ? "You're losing potential reviews. Upgrade to continue collecting feedback without interruption. New review requests will stop until you upgrade."
      : reason === "analytics"
        ? "Understand what's working and improve your review performance. Without insights, you may miss opportunities to improve."
        : reason === "widget"
          ? "Unlock powerful widgets to showcase more customer feedback and build trust. Showcasing reviews builds trust and increases conversions."
          : reason === "team"
            ? "Collaborate with your team and manage reviews more efficiently."
            : null;

  const dashboardEmail = user?.email?.trim() ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-12">
      <div className="max-w-2xl space-y-6">
        <SimplePage
          title="Billing & Plans"
          subtitle="Manage your subscription and usage for this workspace."
        />

        {reasonMessage ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="status"
          >
            {reasonMessage}
          </div>
        ) : null}

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Current plan</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{planLabel}</p>
          <p className="mt-3 text-sm text-gray-600">
            {planKey === "elite"
              ? "Manage your subscription and explore add-ons below."
              : `${upgradeCta} to send more review invitations and unlock more features.`}
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-[#124541] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f3a35]"
            onClick={() => {
              logDashboardActivityClient({
                businessId: selectedBusiness.id,
                action: "upgrade_clicked",
                metadata: { from_plan: planKey, to_plan: "checkout" },
              });
              pricingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            {planKey === "elite" ? "Explore plans" : upgradeCta}
          </button>
        </div>
      </div>

      <section
        ref={pricingSectionRef}
        id="dashboard-pricing-compare"
        aria-label="Compare plans"
        className="scroll-mt-24 border-t border-gray-200 pt-10"
      >
        <h2 className="mb-6 text-lg font-semibold text-[#0E0E0E]">Compare plans</h2>
        <PricingPageContent
          variant="dashboard"
          dashboardBusinessId={selectedBusiness.id}
          dashboardUserEmail={dashboardEmail}
          dashboardCurrentPlanKey={planKey}
          emphasizePremiumAnchor={emphasizePremiumAnchor}
          embedInDashboard
        />
      </section>
    </div>
  );
}
