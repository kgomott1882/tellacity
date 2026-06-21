import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifySapCredentials } from "@/lib/sapConnect";

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
  const apiBaseUrl = typeof o.api_base_url === "string" ? o.api_base_url.trim() : "";
  const tokenUrl = typeof o.token_url === "string" ? o.token_url.trim() : "";
  const clientId = typeof o.client_id === "string" ? o.client_id.trim() : "";
  const clientSecret = typeof o.client_secret === "string" ? o.client_secret.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!apiBaseUrl || !tokenUrl || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "api_base_url, token_url, client_id, and client_secret are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifySapCredentials(apiBaseUrl, tokenUrl, clientId, clientSecret);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("sap_integrations").upsert(
    {
      business_id: businessId,
      api_base_url: verified.api_base_url,
      token_url: verified.token_url,
      client_id: clientId,
      client_secret: clientSecret,
      system_name: verified.system_name,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[SAP connect] Supabase error:", upsertError);
    return NextResponse.json(
      { error: "Failed to save connection. Run the latest database migration if this persists." },
      { status: 500 },
    );
  }

  void logBusinessActivity({
    businessId,
    userId: ctx.userId,
    action: "integration_connected",
    metadata: {
      provider: "sap",
      api_base_url: verified.api_base_url,
      system_name: verified.system_name,
    },
  });

  return NextResponse.json({
    ok: true,
    api_base_url: verified.api_base_url,
    system_name: verified.system_name,
  });
}
