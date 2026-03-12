"use client";

import type { IntegrationState } from "@/lib/integrationsCatalog";

const LABELS: Record<IntegrationState, string> = {
  connected: "Connected",
  available: "Available",
  upgrade_required: "Upgrade required",
  enterprise: "Enterprise",
  coming_soon: "Coming soon",
};

const STYLES: Record<IntegrationState, string> = {
  connected:
    "bg-emerald-50 text-emerald-700 border border-emerald-100",
  available:
    "bg-sky-50 text-sky-700 border border-sky-100",
  upgrade_required:
    "bg-amber-50 text-amber-700 border border-amber-100",
  enterprise:
    "bg-purple-50 text-purple-700 border border-purple-100",
  coming_soon:
    "bg-gray-50 text-gray-600 border border-gray-200",
};

export default function IntegrationStateBadge({ state }: { state: IntegrationState }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  );
}

