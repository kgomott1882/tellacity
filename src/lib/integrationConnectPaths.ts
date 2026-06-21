export function shopifyConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-shopify?business_id=${encodeURIComponent(businessId)}`;
}

export function shopifyManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-shopify?business_id=${encodeURIComponent(businessId)}`;
}

export function wooCommerceConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-woocommerce?business_id=${encodeURIComponent(businessId)}`;
}

export function wooCommerceManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-woocommerce?business_id=${encodeURIComponent(businessId)}`;
}

export function magentoConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-magento?business_id=${encodeURIComponent(businessId)}`;
}

export function magentoManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-magento?business_id=${encodeURIComponent(businessId)}`;
}

export function wordPressConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-wordpress?business_id=${encodeURIComponent(businessId)}`;
}

export function wordPressManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-wordpress?business_id=${encodeURIComponent(businessId)}`;
}

export function klaviyoConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-klaviyo?business_id=${encodeURIComponent(businessId)}`;
}

export function klaviyoManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-klaviyo?business_id=${encodeURIComponent(businessId)}`;
}

export function twilioConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-twilio?business_id=${encodeURIComponent(businessId)}`;
}

export function twilioManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-twilio?business_id=${encodeURIComponent(businessId)}`;
}

export function marketoConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-marketo?business_id=${encodeURIComponent(businessId)}`;
}

export function marketoManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-marketo?business_id=${encodeURIComponent(businessId)}`;
}

export function slackConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-slack?business_id=${encodeURIComponent(businessId)}`;
}

export function slackManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-slack?business_id=${encodeURIComponent(businessId)}`;
}

export function hubSpotConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-hubspot?business_id=${encodeURIComponent(businessId)}`;
}

export function hubSpotManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-hubspot?business_id=${encodeURIComponent(businessId)}`;
}

export function zendeskConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-zendesk?business_id=${encodeURIComponent(businessId)}`;
}

export function zendeskManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-zendesk?business_id=${encodeURIComponent(businessId)}`;
}

export function zapierConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-zapier?business_id=${encodeURIComponent(businessId)}`;
}

export function zapierManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-zapier?business_id=${encodeURIComponent(businessId)}`;
}

export function googleSheetsConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-google-sheets?business_id=${encodeURIComponent(businessId)}`;
}

export function googleSheetsManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-google-sheets?business_id=${encodeURIComponent(businessId)}`;
}

export function salesforceConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-salesforce?business_id=${encodeURIComponent(businessId)}`;
}

export function salesforceManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-salesforce?business_id=${encodeURIComponent(businessId)}`;
}

export function netsuiteConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-netsuite?business_id=${encodeURIComponent(businessId)}`;
}

export function netsuiteManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-netsuite?business_id=${encodeURIComponent(businessId)}`;
}

export function sapConnectPath(businessId: string): string {
  return `/business/dashboard/integrations/connect-sap?business_id=${encodeURIComponent(businessId)}`;
}

export function sapManagePath(businessId: string): string {
  return `/business/dashboard/integrations/manage-sap?business_id=${encodeURIComponent(businessId)}`;
}

export function integrationConnectorPath(slug: string): string {
  return `/business/dashboard/integrations/connectors/${encodeURIComponent(slug)}`;
}

const CONNECT_PATH_BY_SLUG: Record<string, (businessId: string) => string> = {
  shopify: shopifyConnectPath,
  woocommerce: wooCommerceConnectPath,
  magento: magentoConnectPath,
  wordpress: wordPressConnectPath,
  klaviyo: klaviyoConnectPath,
  twilio: twilioConnectPath,
  marketo: marketoConnectPath,
  slack: slackConnectPath,
  hubspot: hubSpotConnectPath,
  zendesk: zendeskConnectPath,
  zapier: zapierConnectPath,
  "google-sheets": googleSheetsConnectPath,
  salesforce: salesforceConnectPath,
  netsuite: netsuiteConnectPath,
  sap: sapConnectPath,
};

const MANAGE_PATH_BY_SLUG: Record<string, (businessId: string) => string> = {
  shopify: shopifyManagePath,
  woocommerce: wooCommerceManagePath,
  magento: magentoManagePath,
  wordpress: wordPressManagePath,
  klaviyo: klaviyoManagePath,
  twilio: twilioManagePath,
  marketo: marketoManagePath,
  slack: slackManagePath,
  hubspot: hubSpotManagePath,
  zendesk: zendeskManagePath,
  zapier: zapierManagePath,
  "google-sheets": googleSheetsManagePath,
  salesforce: salesforceManagePath,
  netsuite: netsuiteManagePath,
  sap: sapManagePath,
};

export function integrationConnectPath(slug: string, businessId: string): string | null {
  const fn = CONNECT_PATH_BY_SLUG[slug];
  return fn ? fn(businessId) : null;
}

export function integrationManagePath(slug: string, businessId: string): string | null {
  const fn = MANAGE_PATH_BY_SLUG[slug];
  return fn ? fn(businessId) : null;
}
