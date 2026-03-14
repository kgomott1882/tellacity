import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const SHOP_NAME_REGEX = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i;

function normalizeShop(shop: string): string {
  const trimmed = shop.trim().toLowerCase();
  if (trimmed.endsWith(".myshopify.com")) return trimmed;
  return `${trimmed}.myshopify.com`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id");
  const shop = searchParams.get("shop");

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "Shopify environment variables not configured. Set SHOPIFY_CLIENT_ID and NEXT_PUBLIC_APP_URL." },
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

  const redirectUri =
    `${appUrl.replace(/\/$/, "")}/api/integrations/shopify/callback` +
    (businessId ? `?business_id=${encodeURIComponent(businessId)}` : "");
  const scope = "read_orders,read_customers";
  const state = randomUUID();

  const authUrl =
    `https://${shopDomain}/admin/oauth/authorize?` +
    new URLSearchParams({
      client_id: clientId,
      scope,
      redirect_uri: redirectUri,
      response_type: "code",
      state,
    }).toString();

  return NextResponse.redirect(authUrl);
}
