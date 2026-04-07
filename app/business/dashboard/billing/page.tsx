"use client";

import { useSearchParams } from "next/navigation";
import SimplePage from "../_components/SimplePage";
import { useBusinessContext } from "../_context/BusinessContext";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

export default function BillingPage() {
  const { selectedBusiness } = useBusinessContext();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  if (!selectedBusiness?.id) return null;

  const planKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const planLabel = PLAN_LABELS[planKey] ?? PLAN_LABELS.free;

  return (
    <div className="max-w-2xl space-y-6">
      <SimplePage
        title="Billing & Plans"
        subtitle="Manage your subscription and usage for this workspace."
      />

      {reason === "limit" ? (
        <div
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          role="status"
        >
          You&apos;ve reached your monthly invite limit. Upgrade your plan to send more review
          invites.
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Current plan</p>
        <p className="mt-1 text-lg font-semibold text-gray-900">{planLabel}</p>
        <p className="mt-3 text-sm text-gray-600">
          Upgrade your plan to send more review invites.
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
          }}
        >
          Upgrade plan
        </button>
      </div>
    </div>
  );
}
