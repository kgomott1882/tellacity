"use client";

import Link from "next/link";
import type {
  IntegrationDefinition,
  IntegrationState,
  IntegrationCategory,
  PlanId,
} from "@/lib/integrationsCatalog";
import IntegrationStateBadge from "./IntegrationStateBadge";

type Props = {
  integration: IntegrationDefinition;
  category: IntegrationCategory;
  state: IntegrationState;
  plan: PlanId;
};

function primaryCtaLabel(state: IntegrationState): string {
  switch (state) {
    case "connected":
      return "Manage connection";
    case "available":
      return "Connect";
    case "upgrade_required":
      return "Upgrade plan";
    case "enterprise":
      return "Request access";
    case "coming_soon":
      return "Coming soon";
    default:
      return "View details";
  }
}

export default function IntegrationDetailView({
  integration,
  category,
  state,
  plan,
}: Props) {
  const ctaLabel = primaryCtaLabel(state);
  const disabled = state === "coming_soon";

  return (
    <div className="flex-1 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="border-b border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/brand/${integration.logoFile}`}
                alt={`${integration.name} logo`}
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <p className="text-xs text-gray-500">{category.label}</p>
              <h1 className="mt-1 text-lg font-semibold text-[#0E0E0E]">
                {integration.name}
              </h1>
              <p className="mt-1 text-sm text-gray-600 max-w-xl">
                {integration.shortDescription}
              </p>
            </div>
          </div>
          <IntegrationStateBadge state={state} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={disabled}
            className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold transition ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : state === "upgrade_required"
                ? "bg-[#0E0E0E] text-white hover:bg-black"
                : state === "enterprise"
                ? "bg-[#1F2937] text-white hover:bg-black"
                : state === "connected"
                ? "bg-[#1FAF9E] text-white hover:bg-[#169786]"
                : "bg-white text-[#1FAF9E] border border-[#1FAF9E] hover:bg-[#F4FFFD]"
            }`}
          >
            {ctaLabel}
          </button>
          {state === "upgrade_required" && (
            <Link
              href="/for-business"
              className="text-xs font-medium text-[#1FAF9E] hover:underline"
            >
              View plans
            </Link>
          )}
          {state === "enterprise" && (
            <Link
              href="/contact/sales"
              className="text-xs font-medium text-[#1FAF9E] hover:underline"
            >
              Contact sales
            </Link>
          )}
        </div>
      </header>

      <div className="px-6 pb-8 pt-4 space-y-8 text-sm text-gray-700">
        <section>
          <h2 className="text-sm font-semibold text-[#0E0E0E]">
            What this integration can do
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>
              Automate review invitations and follow-ups based on events from {integration.name}.
            </li>
            <li>
              Keep customer and feedback data aligned between Tellacity and your existing systems.
            </li>
            <li>
              Give your team a single place to see verified reviews alongside operational data.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#0E0E0E]">
            How setup works
          </h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
            <li>Choose the business you want to connect inside the Tellacity dashboard.</li>
            <li>Authenticate with your {integration.name} account using a secure OAuth flow.</li>
            <li>Pick which events should trigger review invitations or data sync.</li>
            <li>Test the connection, then turn it on for live traffic.</li>
          </ol>
          {integration.isEnterpriseOnly && (
            <p className="mt-3 text-xs text-gray-500">
              Enterprise integrations are configured with a Tellacity solutions engineer. We’ll
              work with your team to align data models, security and rollout.
            </p>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-[#0E0E0E]">Plan access</h2>
          <p className="mt-3 text-sm text-gray-700">
            This integration is available from the{" "}
            <span className="font-semibold capitalize">{integration.minimumPlan}</span> plan
            and above.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Your current plan: <span className="capitalize">{plan}</span>.
          </p>
        </section>
      </div>
    </div>
  );
}

