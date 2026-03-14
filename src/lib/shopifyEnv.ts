/**
 * Single source for Shopify Partner app env vars.
 * Use credentials from the Shopify Partner Dashboard (Apps → your app → Client credentials),
 * not from a general store. All Shopify API routes should use this.
 */

const APP_URL_DEFAULT = "https://tellacity.com";

export type ShopifyEnv = {
  clientId: string;
  clientSecret: string;
  appUrl: string;
  /** Base URL with no trailing slash */
  baseUrl: string;
  /** Fixed callback URL for OAuth (no query params, for Partner whitelist) */
  callbackUrl: string;
};

function getEnv(key: string): string | undefined {
  return process.env[key]?.trim() || undefined;
}

/**
 * Returns Shopify env config. Use in API routes only (server).
 * Returns null if any required var is missing.
 */
export function getShopifyEnv(): ShopifyEnv | null {
  const clientId = getEnv("SHOPIFY_CLIENT_ID");
  const clientSecret = getEnv("SHOPIFY_CLIENT_SECRET");
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL") || APP_URL_DEFAULT;
  const baseUrl = appUrl.replace(/\/$/, "");

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    appUrl,
    baseUrl,
    callbackUrl: `${baseUrl}/api/integrations/shopify/callback`,
  };
}

/**
 * Same as getShopifyEnv but requires clientId and appUrl only (e.g. connect/install don't need secret).
 */
export function getShopifyEnvForOAuthStart(): { clientId: string; appUrl: string; baseUrl: string; callbackUrl: string } | null {
  const clientId = getEnv("SHOPIFY_CLIENT_ID");
  const appUrl = getEnv("NEXT_PUBLIC_APP_URL") || APP_URL_DEFAULT;
  const baseUrl = appUrl.replace(/\/$/, "");

  if (!clientId) return null;

  return {
    clientId,
    appUrl,
    baseUrl,
    callbackUrl: `${baseUrl}/api/integrations/shopify/callback`,
  };
}
