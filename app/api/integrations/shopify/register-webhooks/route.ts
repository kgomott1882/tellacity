import { NextResponse } from "next/server";
import axios from "axios";
import { supabaseServer } from "@/lib/supabaseServer";
import { getShopifyEnv } from "@/lib/shopifyEnv";

export const runtime = "nodejs";

const SHOPIFY_API_VERSION = "2024-01";
const WEBHOOK_TOPICS = ["orders/create", "orders/fulfilled"] as const;

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
    return NextResponse.json(
      { error: "Missing shop_domain" },
      { status: 400 }
    );
  }

  const env = getShopifyEnv();
  const webhookAddress = env?.baseUrl ?? process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://tellacity.com";

  const normalizedShop = shopDomain.trim().toLowerCase();
  const domain =
    normalizedShop.endsWith(".myshopify.com")
      ? normalizedShop
      : `${normalizedShop}.myshopify.com`;

  const { data: row, error: fetchError } = await supabaseServer
    .from("shopify_integrations")
    .select("shop_domain, access_token")
    .eq("shop_domain", domain)
    .single();

  if (fetchError || !row?.access_token) {
    return NextResponse.json(
      { error: "Shop not found or missing access token" },
      { status: 404 }
    );
  }

  const accessToken = row.access_token as string;
  const webhooksUrl = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`;
  const headers = {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
  };

  try {
    for (const topic of WEBHOOK_TOPICS) {
      const { status, data } = await axios.post(
        webhooksUrl,
        {
          webhook: {
            topic,
            address: `${webhookAddress}/api/integrations/shopify/webhook`,
            format: "json",
          },
        },
        {
          headers,
          validateStatus: () => true,
        }
      );

      if (status < 200 || status >= 300) {
        return NextResponse.json(
          { error: "Shopify webhook registration failed", topic, details: data },
          { status: 502 }
        );
      }
    }

    const { error: updateError } = await supabaseServer
      .from("shopify_integrations")
      .update({ webhook_registered: true })
      .eq("shop_domain", domain);

    if (updateError) {
      return NextResponse.json(
        { error: "Webhook registered but failed to update record", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shop_domain: domain,
      webhook_topics: [...WEBHOOK_TOPICS],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Webhook registration failed", details: message },
      { status: 500 }
    );
  }
}
