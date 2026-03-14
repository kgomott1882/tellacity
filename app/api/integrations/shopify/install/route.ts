import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const SCOPE = "read_customers,read_orders,read_products";

const SHOP_NAME_REGEX = /^[a-z0-9-]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "Shopify environment variables not configured" },
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
    client_id: clientId,
    scope: SCOPE,
    redirect_uri: `${appUrl}/api/integrations/shopify/callback`,
    state: randomUUID(),
  });

  const oauthUrl = `${oauthBase}?${params.toString()}`;

  console.log("Normalized Shopify shop:", shopDomain);
  console.log("Shopify OAuth redirect:", oauthUrl);

  return NextResponse.redirect(oauthUrl);
}
