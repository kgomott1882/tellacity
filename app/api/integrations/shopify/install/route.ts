import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getShopifyEnvForOAuthStart } from "@/lib/shopifyEnv";

export const runtime = "nodejs";

const SCOPE = "read_customers,read_orders,read_products";

const SHOP_NAME_REGEX = /^[a-z0-9-]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const env = getShopifyEnvForOAuthStart();
  if (!env) {
    return NextResponse.json(
      { error: "Shopify not configured. Set SHOPIFY_CLIENT_ID (and NEXT_PUBLIC_APP_URL). Use credentials from Shopify Partner Dashboard → Apps → your app → Client credentials." },
      { status: 500 }
    );
  }

  const rawShop = (searchParams.get("shop") ?? "").trim().toLowerCase();
  let shopName = rawShop
    .replace(/^https?:\/\//, "")
    .replace(/\/admin.*$/, "")
    .replace(/\.myshopify\.com$/, "");

  if (!shopName || !SHOP_NAME_REGEX.test(shopName)) {
    return NextResponse.json(
      { error: "Invalid Shopify shop domain" },
      { status: 400 }
    );
  }

  const shopDomain = `${shopName}.myshopify.com`;
  const oauthBase = `https://${shopDomain}/admin/oauth/authorize`;

  const params = new URLSearchParams({
    client_id: env.clientId,
    scope: SCOPE,
    redirect_uri: env.callbackUrl,
    state: randomUUID(),
  });

  const oauthUrl = `${oauthBase}?${params.toString()}`;

  return NextResponse.redirect(oauthUrl);
}
