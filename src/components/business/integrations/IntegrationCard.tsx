"use client";

import { useRouter } from "next/navigation";
import IntegrationStateBadge from "./IntegrationStateBadge";
import type { IntegrationWithState } from "@/lib/integrationsCatalog";

function primaryCtaLabel(state: IntegrationWithState["state"]): string {
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

type Props = {
  integration: {
    slug: string;
    name: string;
    description?: string;
    logo?: string;
    state:
      | "available"
      | "connected"
      | "coming_soon"
      | "enterprise"
      | "upgrade_required";
  };
  businessId?: string;
};

export default function IntegrationCard({ integration, businessId }: Props) {
  const router = useRouter();
  const ctaLabel = primaryCtaLabel(integration.state);
  const disabled = (integration.state as string) === "coming_soon";

  const handleClick = () => {
    if (disabled) return;
    router.push(`/business/dashboard/integrations/connectors/${integration.slug}`);
  };

  const isShopifyAvailable =
    integration.slug === "shopify" &&
    (integration.state as string) === "available" &&
    businessId;

  const primaryCta =
    (integration.state as string) === "connected" ? (
      <span className="text-green-600 font-medium">Connected ✓</span>
    ) : isShopifyAvailable ? (
      <a
        href={`/api/integrations/shopify/connect?business_id=${businessId}`}
        className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition"
      >
        Connect
      </a>
    ) : (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition ${
          disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : (integration.state as string) === "upgrade_required"
            ? "bg-[#0E0E0E] text-white hover:bg-black"
            : (integration.state as string) === "enterprise"
            ? "bg-[#1F2937] text-white hover:bg-black"
            : (integration.state as string) === "connected"
            ? "bg-[#1FAF9E] text-white hover:bg-[#169786]"
            : "bg-white text-[#1FAF9E] border border-[#1FAF9E] hover:bg-[#F4FFFD]"
        }`}
      >
        {ctaLabel}
      </button>
    );

  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#1FAF9E]/70 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={integration.logo ?? `/brand/${integration.slug}.png`}
            alt={`${integration.name} logo`}
            className="h-8 w-auto object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-[#0E0E0E]">
              {integration.name}
            </h3>
            <IntegrationStateBadge state={integration.state} />
          </div>
          <p className="mt-1 text-xs text-gray-600 line-clamp-2">
            {integration.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {primaryCta}
        <button
          type="button"
          onClick={() =>
            router.push(`/business/dashboard/integrations/connectors/${integration.slug}`)
          }
          className="text-xs font-medium text-gray-500 hover:text-[#1FAF9E]"
        >
          View details
        </button>
      </div>
    </div>
  );
}

