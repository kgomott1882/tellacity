import { getGoogleSheetsIntegrationForBusiness } from "@/lib/googleSheetsIntegrationServer";
import { getHubSpotIntegrationForBusiness } from "@/lib/hubspotIntegrationServer";
import { getKlaviyoIntegrationForBusiness } from "@/lib/klaviyoIntegrationServer";
import { getMagentoIntegrationForBusiness } from "@/lib/magentoIntegrationServer";
import { getMarketoIntegrationForBusiness } from "@/lib/marketoIntegrationServer";
import { getNetsuiteIntegrationForBusiness } from "@/lib/netsuiteIntegrationServer";
import { getSalesforceIntegrationForBusiness } from "@/lib/salesforceIntegrationServer";
import { getSapIntegrationForBusiness } from "@/lib/sapIntegrationServer";
import { getShopifyIntegrationWithTokenForBusiness } from "@/lib/shopifyIntegrationServer";
import { getSlackIntegrationForBusiness } from "@/lib/slackIntegrationServer";
import { getTwilioIntegrationForBusiness } from "@/lib/twilioIntegrationServer";
import { getWooCommerceIntegrationForBusiness } from "@/lib/woocommerceIntegrationServer";
import { getWordPressIntegrationForBusiness } from "@/lib/wordpressIntegrationServer";
import { getZendeskIntegrationForBusiness } from "@/lib/zendeskIntegrationServer";
import { getZapierIntegrationForBusiness } from "@/lib/zapierIntegrationServer";

type ConnectedCheck = {
  slug: string;
  isConnected: (businessId: string) => Promise<boolean>;
};

/** Same rules as each provider's GET /api/integrations/{slug}/status (connected: true). */
const CONNECTED_CHECKS: ConnectedCheck[] = [
  {
    slug: "shopify",
    isConnected: async (businessId) => {
      const { row, error } = await getShopifyIntegrationWithTokenForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] shopify:", error);
        return false;
      }
      return Boolean(row?.access_token?.trim());
    },
  },
  {
    slug: "woocommerce",
    isConnected: async (businessId) => {
      const { row, error } = await getWooCommerceIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] woocommerce:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "magento",
    isConnected: async (businessId) => {
      const { row, error } = await getMagentoIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] magento:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "wordpress",
    isConnected: async (businessId) => {
      const { row, error } = await getWordPressIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] wordpress:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "klaviyo",
    isConnected: async (businessId) => {
      const { row, error } = await getKlaviyoIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] klaviyo:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "twilio",
    isConnected: async (businessId) => {
      const { row, error } = await getTwilioIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] twilio:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "marketo",
    isConnected: async (businessId) => {
      const { row, error } = await getMarketoIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] marketo:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "slack",
    isConnected: async (businessId) => {
      const { row, error } = await getSlackIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] slack:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "hubspot",
    isConnected: async (businessId) => {
      const { row, error } = await getHubSpotIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] hubspot:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "zendesk",
    isConnected: async (businessId) => {
      const { row, error } = await getZendeskIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] zendesk:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "zapier",
    isConnected: async (businessId) => {
      const { row, error } = await getZapierIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] zapier:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "google-sheets",
    isConnected: async (businessId) => {
      const { row, error } = await getGoogleSheetsIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] google-sheets:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "salesforce",
    isConnected: async (businessId) => {
      const { row, error } = await getSalesforceIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] salesforce:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "netsuite",
    isConnected: async (businessId) => {
      const { row, error } = await getNetsuiteIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] netsuite:", error);
        return false;
      }
      return Boolean(row);
    },
  },
  {
    slug: "sap",
    isConnected: async (businessId) => {
      const { row, error } = await getSapIntegrationForBusiness(businessId);
      if (error) {
        console.warn("[integrations-connected] sap:", error);
        return false;
      }
      return Boolean(row);
    },
  },
];

export async function connectedProviderSlugsForBusiness(
  businessId: string,
): Promise<{ providers: string[]; error: Error | null }> {
  const providers: string[] = [];

  await Promise.all(
    CONNECTED_CHECKS.map(async ({ slug, isConnected }) => {
      try {
        if (await isConnected(businessId)) {
          providers.push(slug);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn(`[integrations-connected] ${slug}:`, message);
      }
    }),
  );

  providers.sort();
  return { providers, error: null };
}
