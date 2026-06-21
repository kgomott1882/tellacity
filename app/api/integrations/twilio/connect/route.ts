import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifyTwilioCredentials } from "@/lib/twilioConnect";

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
  const accountSid = typeof o.account_sid === "string" ? o.account_sid.trim() : "";
  const authToken = typeof o.auth_token === "string" ? o.auth_token.trim() : "";
  const fromPhone =
    typeof o.from_phone_number === "string" ? o.from_phone_number.trim() : "";
  const messagingSid =
    typeof o.messaging_service_sid === "string" ? o.messaging_service_sid.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!accountSid || !authToken) {
    return NextResponse.json(
      { error: "account_sid and auth_token are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifyTwilioCredentials(accountSid, authToken, {
    from_phone_number: fromPhone || null,
    messaging_service_sid: messagingSid || null,
  });
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("twilio_integrations").upsert(
    {
      business_id: businessId,
      account_sid: accountSid,
      auth_token: authToken,
      account_friendly_name: verified.account_friendly_name,
      from_phone_number: verified.from_phone_number,
      messaging_service_sid: verified.messaging_service_sid,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Twilio connect] Supabase error:", upsertError);
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
      provider: "twilio",
      account_sid: accountSid,
      account_friendly_name: verified.account_friendly_name,
      from_phone_number: verified.from_phone_number,
      messaging_service_sid: verified.messaging_service_sid,
    },
  });

  return NextResponse.json({
    ok: true,
    account_sid: accountSid,
    account_friendly_name: verified.account_friendly_name,
    from_phone_number: verified.from_phone_number,
    messaging_service_sid: verified.messaging_service_sid,
  });
}
