"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  IntegrationDefinition,
  IntegrationState,
  IntegrationCategory,
  PlanId,
} from "@/lib/integrationsCatalog";
import IntegrationStateBadge from "./IntegrationStateBadge";
import {
  GrowUnlockButton,
  GrowUnlockError,
} from "@/components/dashboard/GrowUnlockCta";
import { useGrowUnlockCta } from "@/hooks/useGrowUnlockCta";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import { integrationConnectorPath } from "@/lib/integrationConnectPaths";

type Props = {
  integration: IntegrationDefinition;
  category: IntegrationCategory;
  state: IntegrationState;
  plan: PlanId;
  businessId?: string | null;
  trialEligible?: boolean;
  subscriptionStatus?: string | null;
  onTrialStarted?: () => void;
  /** When set and state is `available`, primary CTA navigates here (e.g. Shopify / WooCommerce connect flow). */
  connectHref?: string | null;
  /** When set and state is `connected`, primary CTA navigates here (e.g. WooCommerce manage). */
  manageHref?: string | null;
};

function primaryCtaLabel(state: IntegrationState): string {
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

export default function IntegrationDetailView({
  integration,
  category,
  state,
  plan,
  businessId,
  trialEligible,
  subscriptionStatus,
  onTrialStarted,
  connectHref,
  manageHref,
}: Props) {
  const router = useRouter();
  const currentPlan: PlanKey = normalizePlanCodeToKey(plan);
  const isGrowUpgrade = state === "upgrade_required" && integration.minimumPlan === "grow";

  const growUnlock = useGrowUnlockCta({
    businessId,
    currentPlan,
    trialEligible: trialEligible === true,
    subscriptionStatus,
    onTrialStarted,
    paidDestination: {
      type: "action",
      run: () => router.push(integrationConnectorPath(integration.slug)),
    },
  });

  const ctaLabel = isGrowUpgrade ? growUnlock.label : primaryCtaLabel(state);
  const disabled = state === "coming_soon";
  const connectLink =
    Boolean(connectHref) && state === "available" && !disabled ? connectHref! : null;
  const manageLink =
    Boolean(manageHref) && state === "connected" && !disabled ? manageHref! : null;
  const actionLink = manageLink ?? connectLink;

  const ctaClassName = `inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold transition ${
    disabled
      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
      : state === "upgrade_required"
        ? "bg-[#0E0E0E] text-white hover:bg-black"
        : state === "enterprise"
          ? "bg-[#1F2937] text-white hover:bg-black"
          : state === "connected"
            ? "bg-[#1FAF9E] text-white hover:bg-[#169786]"
            : "bg-white text-[#1FAF9E] border border-[#1FAF9E] hover:bg-[#F4FFFD]"
  }`;

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
          {actionLink ? (
            <Link href={actionLink} className={ctaClassName}>
              {ctaLabel}
            </Link>
          ) : isGrowUpgrade ? (
            <GrowUnlockButton
              {...growUnlock}
              disabled={disabled}
              className={ctaClassName}
            />
          ) : (
            <button type="button" disabled={disabled} className={ctaClassName}>
              {ctaLabel}
            </button>
          )}
          {state === "upgrade_required" && !isGrowUpgrade ? (
            <Link
              href="/for-business"
              className="text-xs font-medium text-[#1FAF9E] hover:underline"
            >
              View plans
            </Link>
          ) : null}
          {isGrowUpgrade ? (
            <GrowUnlockError message={growUnlock.errorMessage} className="w-full" />
          ) : null}
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
            <li>
              {integration.slug === "shopify"
                ? "Enter your Shopify store domain and approve OAuth access. Tellacity registers order webhooks and stores the token server-side."
                : integration.slug === "woocommerce"
                ? "Add REST API keys from WooCommerce (Advanced → REST API) and connect your store securely over HTTPS."
                : integration.slug === "magento"
                  ? "Create an integration in Magento Admin, activate it, and paste the access token so Tellacity can reach your REST API over HTTPS."
                  : integration.slug === "wordpress"
                    ? "Paste your WordPress site URL. Tellacity verifies /wp-json, then you copy widget embed code into your theme or page builder."
                    : integration.slug === "klaviyo"
                      ? "Create a private API key in Klaviyo (Settings → API keys) and paste it here. Tellacity verifies the key and stores it server-side."
                      : integration.slug === "twilio"
                        ? "Copy Account SID and Auth Token from the Twilio Console. Optionally add a sender number or Messaging Service SID for SMS review invites."
                        : integration.slug === "marketo"
                          ? "Create a LaunchPoint REST service in Marketo Admin and paste the endpoint, Client ID, and Client Secret here."
                          : integration.slug === "slack"
                            ? "Install a Slack app to your workspace, add chat:write scopes, and paste the Bot User OAuth Token (xoxb-). Optionally set a default channel ID."
                            : integration.slug === "hubspot"
                              ? "Create a private app in HubSpot (Settings → Integrations → Private Apps) and paste the access token (pat-)."
                              : integration.slug === "salesforce"
                                ? "Create a Connected App in Salesforce Setup, authorize it for your integration user, and paste the Consumer Key, Consumer Secret, and refresh token here."
                                : integration.slug === "netsuite"
                                  ? "Create a Token-Based Authentication integration in NetSuite, generate an access token, and paste Account ID plus Consumer Key/Secret and Token ID/Secret here."
                                  : integration.slug === "sap"
                                    ? "Create a Communication Arrangement in SAP for your OData APIs and paste the API base URL, OAuth token URL, Client ID, and Client Secret here."
                                    : integration.slug === "zendesk"
                                ? "Enter your Zendesk subdomain, an admin agent email, and API token from Admin Center → APIs."
                                : integration.slug === "zapier"
                                  ? "Create a Zap with Webhooks by Zapier → Catch Hook, turn it on, and paste the hook URL here. Tellacity sends a test payload to verify it."
                                  : integration.slug === "google-sheets"
                                    ? "Share a spreadsheet with a Google service account, enable the Sheets API, and paste the spreadsheet link plus JSON key here."
                                    : `Authenticate with your ${integration.name} account using a secure OAuth flow.`}
            </li>
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
