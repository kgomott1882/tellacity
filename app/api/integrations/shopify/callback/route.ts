import { NextResponse } from "next/server";
import axios from "axios";
import { supabaseServer } from "@/lib/supabaseServer";
import { getShopifyEnv } from "@/lib/shopifyEnv";

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

  const env = getShopifyEnv();
  if (!env) {
    console.error("[Shopify callback] Missing env: SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET (use Shopify Partner Dashboard → Apps → your app → Client credentials)");
    return redirectError(process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com", "Server configuration error");
  }

  try {
    const tokenUrl = `https://${shopDomain}/admin/oauth/access_token`;
    const { data: tokenData } = await axios.post<{
      access_token: string;
      scope?: string;
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

    const baseUrl = env.baseUrl;
    const businessId = decodeState(state);
    const now = new Date().toISOString();
    const { error: upsertError } = await supabaseServer
      .from("shopify_integrations")
      .upsert(
        {
          shop_domain: shopDomain,
          access_token: accessToken,
          scope: scope || null,
          connected_at: now,
          ...(businessId ? { business_id: businessId } : {}),
        },
        {
          onConflict: "shop_domain",
        }
      );

    if (upsertError) {
      console.error("[Shopify callback] Supabase upsert error:", upsertError);
      return redirectError(baseUrl, "Failed to save connection");
    }

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com";
      const registerUrl = `${appUrl.replace(/\/$/, "")}/api/integrations/shopify/register-webhooks`;
      await fetch(registerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shop: shopDomain,
        }),
      });
    } catch (err) {
      console.error("Shopify webhook registration failed:", err);
    }

    return redirectSuccess(baseUrl);
  } catch (err) {
    console.error("[Shopify callback] Error:", err);
    return NextResponse.json(
      { error: "Shopify token exchange failed" },
      { status: 500 }
    );
  }
}
