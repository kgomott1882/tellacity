import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getShopifyEnvForOAuthStart } from "@/lib/shopifyEnv";

const SHOP_NAME_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

function normalizeShop(shop: string): string {
  const trimmed = shop.trim().toLowerCase();
  if (trimmed.endsWith(".myshopify.com")) return trimmed;
  return `${trimmed}.myshopify.com`;
}

/** Encode business_id in state so redirect_uri stays fixed for Shopify whitelist. */
function encodeState(businessId: string | null): string {
  const payload = JSON.stringify({
    b: businessId || null,
    n: randomUUID(),
  });
  return Buffer.from(payload, "utf8").toString("base64url");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");
  const shop = searchParams.get("shop");

  const env = getShopifyEnvForOAuthStart();
  if (!env) {
    return NextResponse.json(
      { error: "Shopify not configured. Set SHOPIFY_CLIENT_ID (and NEXT_PUBLIC_APP_URL). Use credentials from Shopify Partner Dashboard → Apps → your app → Client credentials." },
      { status: 500 }
    );
  }

  if (!shop || typeof shop !== "string") {
    return NextResponse.json(
      { error: "Missing shop parameter. Provide your Shopify store domain (e.g. mystore or mystore.myshopify.com)." },
      { status: 400 }
    );
  }

  const shopDomain = normalizeShop(shop);
  if (!SHOP_NAME_REGEX.test(shopDomain)) {
    return NextResponse.json(
      { error: "Invalid Shopify shop domain." },
      { status: 400 }
    );
  }

  const scope = "read_orders,read_customers";
  const state = encodeState(businessId);

  const authUrl =
    `https://${shopDomain}/admin/oauth/authorize?` +
    new URLSearchParams({
      client_id: env.clientId,
      scope,
      redirect_uri: env.callbackUrl,
      response_type: "code",
      state,
    }).toString();

  return NextResponse.redirect(authUrl);
}
