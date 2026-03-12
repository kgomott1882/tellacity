export type PlanId = "free" | "grow" | "premium" | "elite";

export type IntegrationCategoryId =
  | "ecommerce"
  | "marketing-and-messaging"
  | "crm-and-sales"
  | "support-and-feedback-operations"
  | "enterprise-systems";

export type IntegrationState =
  | "connected"
  | "available"
  | "upgrade_required"
  | "enterprise"
  | "coming_soon";

export type IntegrationDefinition = {
  slug: string;
  name: string;
  categoryId: IntegrationCategoryId;
  shortDescription: string;
  logoFile: string; // lives under /public/brand
  minimumPlan: PlanId;
  isEnterpriseOnly?: boolean;
  isComingSoon?: boolean;
};

export type IntegrationWithState = IntegrationDefinition & {
  state: IntegrationState;
};

export type IntegrationCategory = {
  id: IntegrationCategoryId;
  label: string;
  description: string;
};

export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  {
    id: "ecommerce",
    label: "Ecommerce",
    description: "Connect your online stores to automate review invites and sync orders.",
  },
  {
    id: "marketing-and-messaging",
    label: "Marketing & Messaging",
    description:
      "Trigger review campaigns and customer journeys from your marketing and messaging tools.",
  },
  {
    id: "crm-and-sales",
    label: "CRM & Sales",
    description:
      "Keep customer and deal data in sync so reviews and feedback live alongside your pipeline.",
  },
  {
    id: "support-and-feedback-operations",
    label: "Support & Feedback Operations",
    description:
      "Turn support conversations and feedback workflows into verified reviews and insights.",
  },
  {
    id: "enterprise-systems",
    label: "Enterprise Systems",
    description:
      "Integrate Tellacity into core enterprise platforms with assisted setup from our team.",
  },
];

const planRank: Record<PlanId, number> = {
  free: 0,
  grow: 1,
  premium: 2,
  elite: 3,
};

export function normalizePlanId(raw: string | null | undefined): PlanId {
  const value = (raw ?? "").toLowerCase();
  if (value === "grow") return "grow";
  if (value === "premium") return "premium";
  if (value === "elite") return "elite";
  return "free";
}

export const INTEGRATIONS: IntegrationDefinition[] = [
  // Ecommerce
  {
    slug: "shopify",
    name: "Shopify",
    categoryId: "ecommerce",
    shortDescription:
      "Automatically send review invitations after Shopify orders and keep customer data in sync.",
    logoFile: "shopify.jpg",
    minimumPlan: "grow",
  },
  {
    slug: "woocommerce",
    name: "WooCommerce",
    categoryId: "ecommerce",
    shortDescription:
      "Connect your WooCommerce store to trigger review requests directly from completed orders.",
    logoFile: "woocommerce.jpg",
    minimumPlan: "grow",
  },
  {
    slug: "magento",
    name: "Magento",
    categoryId: "ecommerce",
    shortDescription:
      "Use Magento order events to automate verified review invitations at scale.",
    logoFile: "Magento.jpg",
    minimumPlan: "premium",
  },
  {
    slug: "wordpress",
    name: "WordPress",
    categoryId: "ecommerce",
    shortDescription:
      "Embed Tellacity widgets and review flows directly into your WordPress site.",
    logoFile: "WordPress.jpg",
    minimumPlan: "grow",
  },

  // Marketing & Messaging
  {
    slug: "klaviyo",
    name: "Klaviyo",
    categoryId: "marketing-and-messaging",
    shortDescription:
      "Add Tellacity review flows into Klaviyo campaigns and post-purchase journeys.",
    logoFile: "Klaviyo.jpg",
    minimumPlan: "premium",
  },
  {
    slug: "twilio",
    name: "Twilio",
    categoryId: "marketing-and-messaging",
    shortDescription:
      "Send SMS review invitations and reminders through your Twilio messaging channels.",
    logoFile: "Twilio.jpg",
    minimumPlan: "premium",
  },
  {
    slug: "marketo",
    name: "Marketo",
    categoryId: "marketing-and-messaging",
    shortDescription:
      "Trigger automated review campaigns from Marketo programs and smart campaigns.",
    logoFile: "Marketo.jpg",
    minimumPlan: "elite",
  },
  {
    slug: "slack",
    name: "Slack",
    categoryId: "marketing-and-messaging",
    shortDescription:
      "Stream reviews and important feedback events straight into your Slack channels.",
    logoFile: "Slack.jpg",
    minimumPlan: "premium",
  },

  // CRM & Sales
  {
    slug: "hubspot",
    name: "HubSpot",
    categoryId: "crm-and-sales",
    shortDescription:
      "Sync contacts and deals so reviews and feedback are visible in HubSpot.",
    logoFile: "HubSpot.jpg",
    minimumPlan: "premium",
  },
  {
    slug: "salesforce",
    name: "Salesforce",
    categoryId: "crm-and-sales",
    shortDescription:
      "Surface reviews, NPS, and feedback data on Salesforce accounts and opportunities.",
    logoFile: "Salesforce.jpg",
    minimumPlan: "elite",
    isEnterpriseOnly: true,
  },
  {
    slug: "netsuite",
    name: "NetSuite",
    categoryId: "crm-and-sales",
    shortDescription:
      "Connect NetSuite customer records to Tellacity for unified feedback reporting.",
    logoFile: "NetSuite.jpg",
    minimumPlan: "elite",
    isEnterpriseOnly: true,
  },

  // Support & Feedback Operations
  {
    slug: "zendesk",
    name: "Zendesk",
    categoryId: "support-and-feedback-operations",
    shortDescription:
      "Send review invitations after tickets close and track satisfaction alongside support.",
    logoFile: "Zendesk.jpg",
    minimumPlan: "premium",
  },
  {
    slug: "google-sheets",
    name: "Google Sheets",
    categoryId: "support-and-feedback-operations",
    shortDescription:
      "Export reviews and feedback into Sheets for reporting, QA, or internal workflows.",
    logoFile: "Googlesheets.jpg",
    minimumPlan: "premium",
  },
  {
    slug: "zapier",
    name: "Zapier",
    categoryId: "support-and-feedback-operations",
    shortDescription:
      "Connect Tellacity to thousands of apps using Zapier-powered automations.",
    logoFile: "Zapier.jpg",
    minimumPlan: "elite",
  },

  // Enterprise Systems
  {
    slug: "sap",
    name: "SAP",
    categoryId: "enterprise-systems",
    shortDescription:
      "Enterprise-grade integration between Tellacity and SAP with assisted onboarding.",
    logoFile: "SAP.jpg",
    minimumPlan: "elite",
    isEnterpriseOnly: true,
  },
];

export function deriveIntegrationState(
  integration: IntegrationDefinition,
  plan: PlanId,
  connectedSlugs: string[],
): IntegrationState {
  if (connectedSlugs.includes(integration.slug)) {
    return "connected";
  }

  if (integration.isComingSoon) {
    return "coming_soon";
  }

  if (integration.isEnterpriseOnly) {
    return "enterprise";
  }

  const userRank = planRank[plan];
  const requiredRank = planRank[integration.minimumPlan];

  if (userRank >= requiredRank) {
    return "available";
  }

  return "upgrade_required";
}

export function getIntegrationsWithState(
  plan: PlanId,
  connectedSlugs: string[],
): IntegrationWithState[] {
  return INTEGRATIONS.map((integration) => ({
    ...integration,
    state: deriveIntegrationState(integration, plan, connectedSlugs),
  }));
}

export function getIntegrationBySlug(slug: string): IntegrationDefinition | undefined {
  return INTEGRATIONS.find((integration) => integration.slug === slug);
}

export function getCategoryById(id: string): IntegrationCategory | undefined {
  return INTEGRATION_CATEGORIES.find((category) => category.id === id);
}

export function getIntegrationsForCategory(
  categoryId: IntegrationCategoryId,
  plan: PlanId,
  connectedSlugs: string[],
): IntegrationWithState[] {
  return getIntegrationsWithState(plan, connectedSlugs).filter(
    (integration) => integration.categoryId === categoryId,
  );
}

export function getOverviewBuckets(
  plan: PlanId,
  connectedSlugs: string[],
): {
  connected: IntegrationWithState[];
  available: IntegrationWithState[];
  locked: IntegrationWithState[];
  enterprise: IntegrationWithState[];
} {
  const all = getIntegrationsWithState(plan, connectedSlugs);

  return {
    connected: all.filter((integration) => integration.state === "connected"),
    available: all.filter((integration) => integration.state === "available"),
    locked: all.filter((integration) => integration.state === "upgrade_required"),
    enterprise: all.filter((integration) => integration.state === "enterprise"),
  };
}

