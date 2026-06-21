import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifyMarketoCredentials, normalizeMarketoRestEndpoint } from "@/lib/marketoConnect";

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
  const restEndpoint = typeof o.rest_endpoint === "string" ? o.rest_endpoint.trim() : "";
  const clientId = typeof o.client_id === "string" ? o.client_id.trim() : "";
  const clientSecret = typeof o.client_secret === "string" ? o.client_secret.trim() : "";
  const munchkinId = typeof o.munchkin_id === "string" ? o.munchkin_id.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!restEndpoint || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "rest_endpoint, client_id, and client_secret are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifyMarketoCredentials(
    restEndpoint,
    clientId,
    clientSecret,
    munchkinId || null,
  );
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const endpoint = normalizeMarketoRestEndpoint(restEndpoint);
  if (!endpoint) {
    return NextResponse.json({ error: "Invalid REST endpoint." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("marketo_integrations").upsert(
    {
      business_id: businessId,
      rest_endpoint: endpoint,
      client_id: clientId,
      client_secret: clientSecret,
      munchkin_id: verified.munchkin_id,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Marketo connect] Supabase error:", upsertError);
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
      provider: "marketo",
      rest_endpoint: endpoint,
      munchkin_id: verified.munchkin_id,
    },
  });

  return NextResponse.json({
    ok: true,
    rest_endpoint: endpoint,
    munchkin_id: verified.munchkin_id,
  });
}
