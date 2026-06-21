"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import IntegrationsOverview from "@/components/business/integrations/IntegrationsOverview";
import {
  getOverviewBuckets,
  normalizePlanId,
  type PlanId,
} from "@/lib/integrationsCatalog";
import { normalizePlanCodeToKey } from "@/lib/plans";
import { useBusinessContext } from "../_context/BusinessContext";
import { useConnectedIntegrationSlugs } from "../_hooks/useConnectedIntegrationSlugs";

function integrationNoticeMessage(
  connected: string | null,
  disconnected: string | null,
  error: string | null,
  webhooksPending: boolean,
): string | null {
  if (error) {
    return decodeURIComponent(error);
  }
  if (webhooksPending) {
    return "Shopify is connected, but order webhooks still need registration. Open the Shopify card and tap Register order webhooks.";
  }
  if (connected === "woocommerce") {
    return "WooCommerce is connected. You can manage keys or disconnect from the WooCommerce card.";
  }
  if (connected === "magento") {
    return "Magento is connected. You can manage the token or disconnect from the Magento card.";
  }
  if (connected === "wordpress") {
    return "WordPress is connected. Open the WordPress card to manage your site link and widget embed steps.";
  }
  if (connected === "klaviyo") {
    return "Klaviyo is connected. You can update your API key or disconnect from the Klaviyo card.";
  }
  if (connected === "twilio") {
    return "Twilio is connected. You can update credentials or disconnect from the Twilio card.";
  }
  if (connected === "marketo") {
    return "Marketo is connected. You can update credentials or disconnect from the Marketo card.";
  }
  if (connected === "slack") {
    return "Slack is connected. You can update your bot token or disconnect from the Slack card.";
  }
  if (connected === "hubspot") {
    return "HubSpot is connected. You can update your access token or disconnect from the HubSpot card.";
  }
  if (connected === "salesforce") {
    return "Salesforce is connected. You can update credentials or disconnect from the Salesforce card.";
  }
  if (connected === "netsuite") {
    return "NetSuite is connected. You can update credentials or disconnect from the NetSuite card.";
  }
  if (connected === "sap") {
    return "SAP is connected. You can update credentials or disconnect from the SAP card.";
  }
  if (connected === "zendesk") {
    return "Zendesk is connected. You can update credentials or disconnect from the Zendesk card.";
  }
  if (connected === "zapier") {
    return "Zapier is connected. You can update your Catch Hook URL or disconnect from the Zapier card.";
  }
  if (connected === "google-sheets") {
    return "Google Sheets is connected. You can update your spreadsheet or service account from the Google Sheets card.";
  }
  if (connected === "shopify") {
    return "Shopify is connected. Open the Shopify card to manage your store, webhooks, or disconnect.";
  }
  if (disconnected === "woocommerce") {
    return "WooCommerce has been disconnected.";
  }
  if (disconnected === "magento") {
    return "Magento has been disconnected.";
  }
  if (disconnected === "wordpress") {
    return "WordPress has been disconnected.";
  }
  if (disconnected === "klaviyo") {
    return "Klaviyo has been disconnected.";
  }
  if (disconnected === "twilio") {
    return "Twilio has been disconnected.";
  }
  if (disconnected === "marketo") {
    return "Marketo has been disconnected.";
  }
  if (disconnected === "slack") {
    return "Slack has been disconnected.";
  }
  if (disconnected === "hubspot") {
    return "HubSpot has been disconnected.";
  }
  if (disconnected === "salesforce") {
    return "Salesforce has been disconnected.";
  }
  if (disconnected === "netsuite") {
    return "NetSuite has been disconnected.";
  }
  if (disconnected === "sap") {
    return "SAP has been disconnected.";
  }
  if (disconnected === "zendesk") {
    return "Zendesk has been disconnected.";
  }
  if (disconnected === "zapier") {
    return "Zapier has been disconnected.";
  }
  if (disconnected === "google-sheets") {
    return "Google Sheets has been disconnected.";
  }
  if (disconnected === "shopify") {
    return "Shopify has been disconnected.";
  }
  return null;
}

export default function IntegrationsDashboardPage() {
  const searchParams = useSearchParams();
  const connectedParam = searchParams.get("connected");
  const disconnectedParam = searchParams.get("disconnected");
  const errorParam = searchParams.get("error");
  const webhooksPending = searchParams.get("webhooks") === "pending";
  const refreshKey = `${connectedParam ?? ""}|${disconnectedParam ?? ""}|${errorParam ?? ""}|${webhooksPending}`;

  const { selectedBusiness, bumpNavRefresh } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const plan: PlanId = normalizePlanId(normalizePlanCodeToKey(selectedBusiness?.plan));
  const currentPlan = normalizePlanCodeToKey(selectedBusiness?.plan);
  const connectedSlugs = useConnectedIntegrationSlugs(businessId, refreshKey);

  const [notice, setNotice] = useState<string | null>(() =>
    integrationNoticeMessage(connectedParam, disconnectedParam, errorParam, webhooksPending),
  );

  useEffect(() => {
    setNotice(
      integrationNoticeMessage(connectedParam, disconnectedParam, errorParam, webhooksPending),
    );
  }, [connectedParam, disconnectedParam, errorParam, webhooksPending]);

  if (!businessId) return null;

  const { connected, available, locked, enterprise } = getOverviewBuckets(
    plan,
    connectedSlugs,
  );

  return (
    <div className="space-y-4">
      {notice ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            errorParam
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
          role="status"
        >
          {notice}
        </div>
      ) : null}
      <IntegrationsOverview
        plan={plan}
        businessId={businessId}
        currentPlan={currentPlan}
        trialEligible={selectedBusiness?.trialEligible === true}
        subscriptionStatus={selectedBusiness?.subscriptionStatus}
        onTrialStarted={bumpNavRefresh}
        connected={connected}
        available={available}
        locked={locked}
        enterprise={enterprise}
      />
    </div>
  );
}
