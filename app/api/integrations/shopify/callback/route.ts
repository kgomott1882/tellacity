import { NextResponse } from "next/server";
import axios from "axios";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const REDIRECT_PATH = "/business/dashboard/integrations?connected=shopify";

function redirectSuccess(): NextResponse {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com";
  return NextResponse.redirect(`${base}${REDIRECT_PATH}`);
}

function redirectError(message: string): NextResponse {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com";
  const url = `${base}/business/dashboard/integrations?error=${encodeURIComponent(message)}`;
  return NextResponse.redirect(url);
}

function normalizeShopDomain(shop: string): string {
  const trimmed = shop.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.endsWith(".myshopify.com")) return trimmed;
  return `${trimmed}.myshopify.com`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  if (!code || !shop) {
    return NextResponse.json(
      {
        error: "Missing Shopify OAuth parameters",
        code: null,
        shop: null,
      },
      { status: 400 }
    );
  }

  const shopDomain = normalizeShopDomain(shop);
  if (!shopDomain || !shopDomain.endsWith(".myshopify.com")) {
    return NextResponse.json(
      {
        error: "Missing Shopify OAuth parameters",
        code: null,
        shop: null,
      },
      { status: 400 }
    );
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    console.error("[Shopify callback] Missing env: SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, or NEXT_PUBLIC_APP_URL");
    return redirectError("Server configuration error");
  }

  try {
    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;
    const { data: tokenData } = await axios.post<{
      access_token: string;
      scope?: string;
    }>(
      tokenUrl,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: { "Content-Type": "application/json" },
        validateStatus: () => true,
      }
    );

    const accessToken = tokenData?.access_token;
    const scope = tokenData?.scope ?? "";

    if (!accessToken) {
      console.error("[Shopify callback] Token exchange failed for shop:", shopDomain, tokenData);
      return NextResponse.json(
        { error: "Shopify token exchange failed" },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();
    const { error: upsertError } = await supabaseServer
      .from("shopify_integrations")
      .upsert(
        {
          shop_domain: shopDomain,
          access_token: accessToken,
          scope: scope || null,
          connected_at: now,
        },
        {
          onConflict: "shop_domain",
        }
      );

    if (upsertError) {
      console.error("[Shopify callback] Supabase upsert error:", upsertError);
      return redirectError("Failed to save connection");
    }

    return redirectSuccess();
  } catch (err) {
    console.error("[Shopify callback] Error:", err);
    return NextResponse.json(
      { error: "Shopify token exchange failed" },
      { status: 500 }
    );
  }
}
