import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  getShopifyIntegrationForBusiness,
  registerShopifyWebhooksForDomain,
} from "@/lib/shopifyIntegrationServer";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Authenticated webhook registration for the dashboard (by business_id). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const businessId =
    typeof (body as { business_id?: unknown }).business_id === "string"
      ? (body as { business_id: string }).business_id.trim()
      : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const { row, error } = await getShopifyIntegrationForBusiness(businessId);
  if (error) {
    console.error("[Shopify register-webhooks]", error);
    return NextResponse.json({ error: "Could not load Shopify connection." }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Shopify is not connected for this business." }, { status: 404 });
  }

  const result = await registerShopifyWebhooksForDomain(row.shop_domain);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true, shop_domain: row.shop_domain });
}
