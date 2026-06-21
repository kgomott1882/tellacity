import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  getShopifyIntegrationWithTokenForBusiness,
  verifyShopifyAccessToken,
} from "@/lib/shopifyIntegrationServer";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id")?.trim() ?? "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const { row, error } = await getShopifyIntegrationWithTokenForBusiness(businessId);
  if (error) {
    console.error("[Shopify status]", error);
    return NextResponse.json({ error: "Could not load connection status." }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ connected: false });
  }

  let shop_name: string | null = null;
  let token_valid = false;
  let token_error: string | null = null;

  const verified = await verifyShopifyAccessToken(row.shop_domain, row.access_token);
  if (verified.ok) {
    token_valid = true;
    shop_name = verified.shop_name;
  } else {
    token_error = verified.message;
  }

  return NextResponse.json({
    connected: true,
    shop_domain: row.shop_domain,
    shop_name,
    scope: row.scope,
    webhook_registered: row.webhook_registered,
    token_valid,
    token_error,
    connected_at: row.connected_at,
    updated_at: row.updated_at,
  });
}
