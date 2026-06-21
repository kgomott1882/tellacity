"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import IntegrationStateBadge from "./IntegrationStateBadge";
import type { IntegrationWithState } from "@/lib/integrationsCatalog";
import {
  integrationConnectPath,
  integrationConnectorPath,
  integrationManagePath,
} from "@/lib/integrationConnectPaths";

function primaryCtaLabel(state: IntegrationWithState["state"]): string {
  switch (state) {
    case "connected":
      return "Manage connection";
    case "available":
      return "Connect";
    case "upgrade_required":
      return "Upgrade your plan";
    case "enterprise":
      return "Request access";
    case "coming_soon":
      return "Coming soon";
    default:
      return "View details";
  }
}

type Props = {
  integration: IntegrationWithState;
  businessId?: string;
};

export default function IntegrationCard({ integration, businessId }: Props) {
  const router = useRouter();
  const ctaLabel = primaryCtaLabel(integration.state);
  const disabled = integration.state === "coming_soon";
  const description = integration.shortDescription;

  const connectHref =
    businessId && integration.state === "available"
      ? integrationConnectPath(integration.slug, businessId)
      : null;

  const manageHref =
    businessId && integration.state === "connected"
      ? integrationManagePath(integration.slug, businessId)
      : null;

  const primaryCta =
    manageHref ? (
      <Link
        href={manageHref}
        className="inline-flex items-center justify-center rounded-md bg-[#1FAF9E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#169786] transition"
      >
        Manage connection
      </Link>
    ) : connectHref ? (
      <Link
        href={connectHref}
        className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition"
      >
        Connect
      </Link>
    ) : integration.state === "connected" ? (
      <span className="text-sm font-medium text-green-600">Connected ✓</span>
    ) : (
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          router.push(integrationConnectorPath(integration.slug));
        }}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : integration.state === "upgrade_required"
              ? "bg-[#0E0E0E] text-white hover:bg-black"
              : integration.state === "enterprise"
                ? "bg-[#1F2937] text-white hover:bg-black"
                : "bg-white text-[#1FAF9E] border border-[#1FAF9E] hover:bg-[#F4FFFD]"
        }`}
      >
        {ctaLabel}
      </button>
    );

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#1FAF9E]/70 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/brand/${integration.logoFile}`}
            alt={`${integration.name} logo`}
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[#0E0E0E]">
              {integration.name}
            </h3>
            <IntegrationStateBadge state={integration.state} />
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-gray-600">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {primaryCta}
        <button
          type="button"
          onClick={() => router.push(integrationConnectorPath(integration.slug))}
          className="text-xs font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          View details
        </button>
      </div>
    </div>
  );
}
