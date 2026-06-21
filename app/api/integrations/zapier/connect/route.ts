import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import {
  normalizeZapierWebhookUrl,
  normalizeZapierZapLabel,
  verifyZapierWebhookUrl,
} from "@/lib/zapierConnect";

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
  const webhookRaw = typeof o.webhook_url === "string" ? o.webhook_url.trim() : "";
  const zapLabel =
    typeof o.zap_label === "string" ? normalizeZapierZapLabel(o.zap_label) : null;

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!webhookRaw) {
    return NextResponse.json({ error: "webhook_url is required" }, { status: 400 });
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifyZapierWebhookUrl(webhookRaw);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const webhookUrl = normalizeZapierWebhookUrl(webhookRaw);
  if (!webhookUrl) {
    return NextResponse.json({ error: "Invalid webhook URL." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("zapier_integrations").upsert(
    {
      business_id: businessId,
      webhook_url: webhookUrl,
      zap_label: zapLabel,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Zapier connect] Supabase error:", upsertError);
    return NextResponse.json(
      { error: "Failed to save connection. Run the latest database migration if this persists." },
      { status: 500 },
    );
  }

  void logBusinessActivity({
    businessId,
    userId: ctx.userId,
    action: "integration_connected",
    metadata: { provider: "zapier", zap_label: zapLabel },
  });

  return NextResponse.json({ ok: true, webhook_url: webhookUrl, zap_label: zapLabel });
}
