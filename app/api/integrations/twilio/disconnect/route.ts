import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { deleteTwilioIntegrationForBusiness } from "@/lib/twilioIntegrationServer";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const { ok, error } = await deleteTwilioIntegrationForBusiness(businessId);
  if (!ok) {
    console.error("[Twilio disconnect]", error);
    return NextResponse.json(
      { error: error ?? "Failed to disconnect Twilio." },
      { status: 500 },
    );
  }

  void logBusinessActivity({
    businessId,
    userId: ctx.userId,
    action: "integration_disconnected",
    metadata: { provider: "twilio" },
  });

  return NextResponse.json({ ok: true });
}
