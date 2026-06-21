import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getShopifyEnvForOAuthStart } from "@/lib/shopifyEnv";
import { normalizeShopifyShopDomain } from "@/lib/shopifyConnect";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const businessId = searchParams.get("business_id")?.trim() ?? "";
  const shop = searchParams.get("shop");

  const env = getShopifyEnvForOAuthStart();
  if (!env) {
    return NextResponse.json(
      {
        error:
          "Shopify not configured. Set SHOPIFY_CLIENT_ID (and NEXT_PUBLIC_APP_URL). Use credentials from Shopify Partner Dashboard → Apps → your app → Client credentials.",
      },
      { status: 500 },
    );
  }

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json(
      { error: "Missing or invalid business_id. Open Connect Shopify from the integrations dashboard." },
      { status: 400 },
    );
  }

  if (!shop || typeof shop !== "string") {
    return NextResponse.json(
      {
        error:
          "Missing shop parameter. Provide your Shopify store domain (e.g. mystore or mystore.myshopify.com).",
      },
      { status: 400 },
    );
  }

  const shopDomain = normalizeShopifyShopDomain(shop);
  if (!shopDomain) {
    return NextResponse.json({ error: "Invalid Shopify shop domain." }, { status: 400 });
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

