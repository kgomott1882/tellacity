import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifyNetsuiteCredentials } from "@/lib/netsuiteConnect";

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
  const accountId = typeof o.account_id === "string" ? o.account_id.trim() : "";
  const consumerKey = typeof o.consumer_key === "string" ? o.consumer_key.trim() : "";
  const consumerSecret = typeof o.consumer_secret === "string" ? o.consumer_secret.trim() : "";
  const tokenId = typeof o.token_id === "string" ? o.token_id.trim() : "";
  const tokenSecret = typeof o.token_secret === "string" ? o.token_secret.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!accountId || !consumerKey || !consumerSecret || !tokenId || !tokenSecret) {
    return NextResponse.json(
      {
        error:
          "account_id, consumer_key, consumer_secret, token_id, and token_secret are required",
      },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifyNetsuiteCredentials(
    accountId,
    consumerKey,
    consumerSecret,
    tokenId,
    tokenSecret,
  );
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("netsuite_integrations").upsert(
    {
      business_id: businessId,
      account_id: verified.account_id,
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      token_id: tokenId,
      token_secret: tokenSecret,
      account_name: verified.account_name,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[NetSuite connect] Supabase error:", upsertError);
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
      provider: "netsuite",
      account_id: verified.account_id,
      account_name: verified.account_name,
    },
  });

  return NextResponse.json({
    ok: true,
    account_id: verified.account_id,
    account_name: verified.account_name,
  });
}
