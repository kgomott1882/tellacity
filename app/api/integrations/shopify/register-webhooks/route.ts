import { NextResponse } from "next/server";
import { getShopifyEnv } from "@/lib/shopifyEnv";
import { registerShopifyWebhooksForDomain } from "@/lib/shopifyIntegrationServer";

export const runtime = "nodejs";

/** Legacy/server webhook registration by shop domain (used after OAuth callback). */
export async function POST(request: Request) {
  let shopDomain: string | null = null;

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      shopDomain = body.shop_domain ?? body.shop ?? null;
    }
    if (!shopDomain) {
      const { searchParams } = new URL(request.url);
      shopDomain = searchParams.get("shop_domain") ?? searchParams.get("shop");
    }
  } catch {
    shopDomain = null;
  }

  if (!shopDomain || typeof shopDomain !== "string") {
    return NextResponse.json({ error: "Missing shop_domain" }, { status: 400 });
  }

  if (!getShopifyEnv()) {
    return NextResponse.json({ error: "Shopify not configured" }, { status: 500 });
  }

  const normalizedShop = shopDomain.trim().toLowerCase();
  const domain = normalizedShop.endsWith(".myshopify.com")
    ? normalizedShop
    : `${normalizedShop}.myshopify.com`;

  const result = await registerShopifyWebhooksForDomain(domain);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    shop_domain: domain,
  });
}
