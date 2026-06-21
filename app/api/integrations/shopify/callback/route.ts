import { NextResponse } from "next/server";
import axios from "axios";
import { supabaseServer } from "@/lib/supabaseServer";
import { getShopifyEnv } from "@/lib/shopifyEnv";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { registerShopifyWebhooksForDomain } from "@/lib/shopifyIntegrationServer";

export const runtime = "nodejs";

const REDIRECT_PATH = "/business/dashboard/integrations?connected=shopify";

function redirectSuccess(baseUrl: string): NextResponse {
  return NextResponse.redirect(`${baseUrl}${REDIRECT_PATH}`);
}

function redirectError(baseUrl: string, message: string): NextResponse {
  const url = `${baseUrl}/business/dashboard/integrations?error=${encodeURIComponent(message)}`;
  return NextResponse.redirect(url);
}

function normalizeShopDomain(shop: string): string {
  const trimmed = shop.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.endsWith(".myshopify.com")) return trimmed;
  return `${trimmed}.myshopify.com`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Decode state from connect route: base64url JSON { b: businessId, n: nonce }. */
function decodeState(state: string | null): string | null {
  if (!state || typeof state !== "string") return null;
  try {
    const json = Buffer.from(state, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as { b?: string | null };
    const id = parsed?.b;
    if (typeof id !== "string" || !id.trim()) return null;
    const trimmed = id.trim();
    return UUID_REGEX.test(trimmed) ? trimmed : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  const env = getShopifyEnv();
  const baseUrl = env?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://tellacity.com";

  if (!code || !shop) {
    return redirectError(baseUrl, "Missing Shopify OAuth parameters.");
  }

  const shopDomain = normalizeShopDomain(shop);
  if (!shopDomain || !shopDomain.endsWith(".myshopify.com")) {
    return redirectError(baseUrl, "Invalid Shopify store domain.");
  }

  const businessId = decodeState(state);
  if (!businessId) {
    return redirectError(
      baseUrl,
      "Missing business context. Open Connect Shopify from your Tellacity integrations dashboard.",
    );
  }

  if (!env) {
    console.error(
      "[Shopify callback] Missing env: SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET",
    );
    return redirectError(baseUrl, "Shopify is not configured on the server.");
  }

  try {
    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;
    const { data: tokenData, status: tokenStatus } = await axios.post<{
      access_token?: string;
      scope?: string;
      error?: string;
    }>(
      tokenUrl,
      {
        client_id: env.clientId,
        client_secret: env.clientSecret,
        code,
      },
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      },
    );

    const accessToken = tokenData?.access_token;
    const scope = tokenData?.scope ?? "";

    if (!accessToken) {
      console.error("[Shopify callback] Token exchange failed:", shopDomain, tokenStatus, tokenData);
      return redirectError(baseUrl, "Shopify authorization failed. Try connecting again.");
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabaseServer.from("shopify_integrations").upsert(
      {
        business_id: businessId,
        shop_domain: shopDomain,
        access_token: accessToken,
        scope: scope || null,
        webhook_registered: false,
        connected_at: now,
        updated_at: now,
      },
      { onConflict: "shop_domain" },
    );

    if (upsertError) {
      console.error("[Shopify callback] Supabase upsert error:", upsertError);
      return redirectError(baseUrl, "Failed to save connection. Run the latest database migration.");
    }

    void logBusinessActivity({
      businessId,
      userId: null,
      action: "integration_connected",
      metadata: { provider: "shopify", shop: shopDomain },
    });

    const webhookResult = await registerShopifyWebhooksForDomain(shopDomain);
    if (!webhookResult.ok) {
      console.warn("[Shopify callback] Webhook registration failed:", webhookResult.error);
      return NextResponse.redirect(
        `${baseUrl}/business/dashboard/integrations?connected=shopify&webhooks=pending`,
      );
    }

    return redirectSuccess(baseUrl);
  } catch (err) {
    console.error("[Shopify callback] Error:", err);
    return redirectError(baseUrl, "Shopify connection failed unexpectedly.");
  }
}
