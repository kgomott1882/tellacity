import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import {
  normalizeMagentoSiteUrl,
  normalizeMagentoStoreCode,
  verifyMagentoRestCredentials,
} from "@/lib/magentoConnect";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const businessId = typeof o.business_id === "string" ? o.business_id.trim() : "";
  const siteRaw = typeof o.site_url === "string" ? o.site_url : "";
  const accessToken = typeof o.access_token === "string" ? o.access_token.trim() : "";
  const storeCode = normalizeMagentoStoreCode(
    typeof o.store_code === "string" ? o.store_code : undefined,
  );

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!siteRaw || !accessToken) {
    return NextResponse.json(
      { error: "site_url and access_token are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const siteUrl = normalizeMagentoSiteUrl(siteRaw);
  if (!siteUrl) {
    return NextResponse.json(
      {
        error:
          "Invalid site URL. Use https://yourstore.com (http allowed only for localhost).",
      },
      { status: 400 },
    );
  }

  const verified = await verifyMagentoRestCredentials(siteUrl, accessToken, storeCode);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("magento_integrations").upsert(
    {
      business_id: businessId,
      site_url: siteUrl,
      access_token: accessToken,
      store_code: storeCode,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Magento connect] Supabase error:", upsertError);
    return NextResponse.json(
      { error: "Failed to save connection. Run the latest database migration if this persists." },
      { status: 500 },
    );
  }

  void logBusinessActivity({
    businessId,
    userId: ctx.userId,
    action: "integration_connected",
    metadata: { provider: "magento", site_url: siteUrl, store_code: storeCode },
  });

  return NextResponse.json({ ok: true, site_url: siteUrl, store_code: storeCode });
}
