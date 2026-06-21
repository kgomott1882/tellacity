import axios from "axios";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { getShopifyEnv } from "@/lib/shopifyEnv";

export const SHOPIFY_API_VERSION = "2024-01";
export const SHOPIFY_WEBHOOK_TOPICS = ["orders/create", "orders/fulfilled"] as const;

export type ShopifyIntegrationRow = {
  id: string;
  business_id: string | null;
  shop_domain: string;
  scope: string | null;
  webhook_registered: boolean;
  connected_at: string;
  updated_at: string;
};

export type ShopifyIntegrationWithTokenRow = ShopifyIntegrationRow & {
  access_token: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

const SHOPIFY_ROW_SELECT =
  "id, business_id, shop_domain, scope, webhook_registered, connected_at, updated_at";

/** Latest Shopify row for a business (limit 1 avoids maybeSingle errors on duplicate legacy rows). */
export async function getShopifyIntegrationForBusiness(
  businessId: string,
): Promise<{ row: ShopifyIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("shopify_integrations")
      .select(SHOPIFY_ROW_SELECT)
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      return { row: null, error: error.message };
    }
    const row = data?.[0];
    if (!row) {
      return { row: null, error: null };
    }
    return { row: row as ShopifyIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Shopify connection";
    return { row: null, error: message };
  }
}

export async function getShopifyIntegrationWithTokenForBusiness(
  businessId: string,
): Promise<{ row: ShopifyIntegrationWithTokenRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("shopify_integrations")
      .select(`${SHOPIFY_ROW_SELECT}, access_token`)
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      return { row: null, error: error.message };
    }
    const row = data?.[0];
    if (!row?.access_token) {
      return { row: null, error: null };
    }
    return { row: row as ShopifyIntegrationWithTokenRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Shopify connection";
    return { row: null, error: message };
  }
}

export async function hasShopifyIntegrationForBusiness(businessId: string): Promise<boolean> {
  const { row, error } = await getShopifyIntegrationWithTokenForBusiness(businessId);
  if (error) {
    console.warn("[Shopify hasIntegration]", error);
    return false;
  }
  return Boolean(row?.access_token?.trim());
}

export async function deleteShopifyIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db.from("shopify_integrations").delete().eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect Shopify";
    return { ok: false, error: message };
  }
}

/** Verify access token can read shop metadata. */
export async function verifyShopifyAccessToken(
  shopDomain: string,
  accessToken: string,
): Promise<
  | { ok: true; shop_name: string | null }
  | { ok: false; message: string }
> {
  try {
    const res = await axios.get<{ shop?: { name?: string } }>(
      `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          Accept: "application/json",
        },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        message: "Shopify rejected this access token. Reconnect the store from the dashboard.",
      };
    }
    if (res.status !== 200) {
      return {
        ok: false,
        message: `Shopify returned HTTP ${res.status} when verifying the store.`,
      };
    }

    const shopName =
      typeof res.data?.shop?.name === "string" && res.data.shop.name.trim()
        ? res.data.shop.name.trim()
        : null;
    return { ok: true, shop_name: shopName };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Shopify (${msg}). Try again in a moment.`,
    };
  }
}

export async function registerShopifyWebhooksForDomain(
  shopDomain: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = serviceDb();
  const { data: row, error: fetchError } = await db
    .from("shopify_integrations")
    .select("shop_domain, access_token")
    .eq("shop_domain", shopDomain)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !row?.access_token) {
    return { ok: false, error: "Shop not found or missing access token." };
  }

  const env = getShopifyEnv();
  const webhookBase =
    env?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://tellacity.com";
  const accessToken = row.access_token as string;
  const webhooksUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`;
  const headers = {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
  };

  try {
    for (const topic of SHOPIFY_WEBHOOK_TOPICS) {
      const res = await axios.post(
        webhooksUrl,
        {
          webhook: {
            topic,
            address: `${webhookBase}/api/integrations/shopify/webhook`,
            format: "json",
          },
        },
        { headers, validateStatus: () => true },
      );

      if (res.status < 200 || res.status >= 300) {
        const detail =
          typeof res.data === "object" && res.data !== null
            ? JSON.stringify(res.data).slice(0, 200)
            : String(res.status);
        return {
          ok: false,
          error: `Webhook registration failed for ${topic} (${detail}).`,
        };
      }
    }

    const { error: updateError } = await db
      .from("shopify_integrations")
      .update({ webhook_registered: true, updated_at: new Date().toISOString() })
      .eq("shop_domain", shopDomain);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook registration failed";
    return { ok: false, error: message };
  }
}
