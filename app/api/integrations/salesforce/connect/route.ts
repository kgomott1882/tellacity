import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifySalesforceCredentials } from "@/lib/salesforceConnect";

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
  const loginHost =
    typeof o.login_host === "string" ? o.login_host.trim() : "production";
  const clientId = typeof o.client_id === "string" ? o.client_id.trim() : "";
  const clientSecret = typeof o.client_secret === "string" ? o.client_secret.trim() : "";
  const refreshToken = typeof o.refresh_token === "string" ? o.refresh_token.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      { error: "client_id, client_secret, and refresh_token are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifySalesforceCredentials(
    loginHost,
    clientId,
    clientSecret,
    refreshToken,
  );
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("salesforce_integrations").upsert(
    {
      business_id: businessId,
      login_host: verified.login_host,
      instance_url: verified.instance_url,
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      org_id: verified.org_id,
      org_name: verified.org_name,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Salesforce connect] Supabase error:", upsertError);
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
      provider: "salesforce",
      instance_url: verified.instance_url,
      org_id: verified.org_id,
      org_name: verified.org_name,
    },
  });

  return NextResponse.json({
    ok: true,
    instance_url: verified.instance_url,
    org_id: verified.org_id,
    org_name: verified.org_name,
  });
}
