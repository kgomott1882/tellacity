import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifySlackBotToken } from "@/lib/slackConnect";

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
  const botToken = typeof o.bot_token === "string" ? o.bot_token.trim() : "";
  const defaultChannelId =
    typeof o.default_channel_id === "string" ? o.default_channel_id.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!botToken) {
    return NextResponse.json({ error: "bot_token is required" }, { status: 400 });
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifySlackBotToken(botToken, defaultChannelId || null);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("slack_integrations").upsert(
    {
      business_id: businessId,
      bot_token: botToken,
      workspace_id: verified.workspace_id,
      workspace_name: verified.workspace_name,
      default_channel_id: verified.default_channel_id,
      default_channel_name: verified.default_channel_name,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Slack connect] Supabase error:", upsertError);
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
      provider: "slack",
      workspace_id: verified.workspace_id,
      workspace_name: verified.workspace_name,
      default_channel_id: verified.default_channel_id,
    },
  });

  return NextResponse.json({
    ok: true,
    workspace_id: verified.workspace_id,
    workspace_name: verified.workspace_name,
    default_channel_id: verified.default_channel_id,
    default_channel_name: verified.default_channel_name,
  });
}
