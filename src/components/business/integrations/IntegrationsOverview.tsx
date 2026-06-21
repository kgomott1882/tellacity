"use client";

import IntegrationSection from "./IntegrationSection";
import type { IntegrationWithState, PlanId } from "@/lib/integrationsCatalog";
import type { PlanKey } from "@/lib/plans";

type Props = {
  plan: PlanId;
  connected: IntegrationWithState[];
  available: IntegrationWithState[];
  locked: IntegrationWithState[];
  enterprise: IntegrationWithState[];
  businessId: string | null;
  currentPlan?: PlanKey;
  trialEligible?: boolean;
  subscriptionStatus?: string | null;
  onTrialStarted?: () => void;
};

function planLabel(plan: PlanId): string {
  switch (plan) {
    case "free":
      return "Free plan";
    case "grow":
      return "Grow plan";
    case "premium":
      return "Premium plan";
    case "elite":
      return "Elite plan";
    default:
      return plan;
  }
}

export default function IntegrationsOverview({
  plan,
  businessId,
  currentPlan,
  trialEligible,
  subscriptionStatus,
  onTrialStarted,
  connected,
  available,
  locked,
  enterprise,
}: Props) {
  const total = connected.length + available.length + locked.length + enterprise.length;

  const trialSectionProps = {
    businessId,
    currentPlan,
    trialEligible,
    subscriptionStatus,
    onTrialStarted,
  };

  return (
    <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm">
      <header className="border-b border-gray-200 px-6 py-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#0E0E0E]">Integrations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Connect Tellacity to your business systems.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Current plan: <span className="font-semibold text-[#0E0E0E]">{planLabel(plan)}</span>
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Connected" value={connected.length} tone="emerald" />
          <SummaryCard
            label="Available on your plan"
            value={available.length}
            tone="sky"
          />
          <SummaryCard label="Locked" value={locked.length} tone="amber" />
          <SummaryCard label="Enterprise" value={enterprise.length} tone="purple" />
        </div>

        {total === 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Integrations will appear here as we enable them for your account.
          </p>
        )}
      </header>

      <div className="px-6 pb-6 pt-4">
        <IntegrationSection
          title="Connected integrations"
          description="These integrations are already connected for this business."
          integrations={connected}
          {...trialSectionProps}
          emptyLabel="No integrations are connected yet."
        />

        <IntegrationSection
          title="Available on your plan"
          description="You can connect these integrations on your current plan without upgrading."
          integrations={available}
          {...trialSectionProps}
          emptyLabel="No additional integrations are available on your current plan."
        />

        <IntegrationSection
          title="More connectors on higher plans"
          description="Unlock these integrations to sync reviews with the tools your team already uses."
          integrations={locked}
          {...trialSectionProps}
          emptyLabel="All currently available integrations are already included in your plan."
        />

        <IntegrationSection
          title="Enterprise & assisted setup"
          description="These integrations are available for Elite and enterprise customers. Our team will help you design and implement the connection."
          integrations={enterprise}
          {...trialSectionProps}
          emptyLabel="Enterprise integrations are not yet available."
        />
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  tone: "emerald" | "sky" | "amber" | "purple";
};

function SummaryCard({ label, value, tone }: SummaryCardProps) {
  const toneClasses: Record<SummaryCardProps["tone"], string> = {
    emerald: "bg-emerald-50 text-emerald-700",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3">
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-1 text-xl font-semibold text-[#0E0E0E]">{value}</p>
      </div>
      <div
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${toneClasses[tone]}`}
      >
        {value}
      </div>
    </div>
  );
}

