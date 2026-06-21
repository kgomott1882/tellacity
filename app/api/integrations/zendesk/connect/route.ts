import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifyZendeskCredentials } from "@/lib/zendeskConnect";

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
  const subdomain = typeof o.subdomain === "string" ? o.subdomain.trim() : "";
  const agentEmail = typeof o.agent_email === "string" ? o.agent_email.trim() : "";
  const apiToken = typeof o.api_token === "string" ? o.api_token.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!subdomain || !agentEmail || !apiToken) {
    return NextResponse.json(
      { error: "subdomain, agent_email, and api_token are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifyZendeskCredentials(subdomain, agentEmail, apiToken);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("zendesk_integrations").upsert(
    {
      business_id: businessId,
      subdomain: verified.subdomain,
      agent_email: agentEmail.toLowerCase(),
      api_token: apiToken,
      account_name: verified.account_name,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Zendesk connect] Supabase error:", upsertError);
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
      provider: "zendesk",
      subdomain: verified.subdomain,
      account_name: verified.account_name,
    },
  });

  return NextResponse.json({
    ok: true,
    subdomain: verified.subdomain,
    account_name: verified.account_name,
  });
}
