import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { getActivePlanKeyForBusiness } from "@/lib/plans";

type FontKey = "system" | "inter" | "serif" | "mono";
type WidgetWhiteLabelSettings = {
  starColor: string;
  textColor: string;
  accentColor: string;
  font: FontKey;
  showTellacityLogo: boolean;
};

const DEFAULTS: WidgetWhiteLabelSettings = {
  starColor: "#12B76A",
  textColor: "#000000",
  accentColor: "#000000",
  font: "system",
  showTellacityLogo: true,
};

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim());
}

function sanitizeSettings(input: unknown): WidgetWhiteLabelSettings {
  const src = (input && typeof input === "object") ? (input as Record<string, unknown>) : {};
  const fontRaw = String(src.font ?? DEFAULTS.font).toLowerCase();
  const font: FontKey =
    fontRaw === "inter" || fontRaw === "serif" || fontRaw === "mono" || fontRaw === "system"
      ? (fontRaw as FontKey)
      : DEFAULTS.font;
  return {
    starColor: isHexColor(src.starColor) ? src.starColor.trim() : DEFAULTS.starColor,
    textColor: isHexColor(src.textColor) ? src.textColor.trim() : DEFAULTS.textColor,
    accentColor: isHexColor(src.accentColor) ? src.accentColor.trim() : DEFAULTS.accentColor,
    font,
    showTellacityLogo:
      typeof src.showTellacityLogo === "boolean"
        ? src.showTellacityLogo
        : DEFAULTS.showTellacityLogo,
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await context.params;
  const ctx = await requireBusinessAccess(req, businessId);
  if (!ctx.ok) return ctx.response;

  const plan = await getActivePlanKeyForBusiness(businessId, ctx.db);
  if (plan !== "elite") {
    return NextResponse.json(
      { error: "White-label settings are available on Elite only." },
      { status: 403 }
    );
  }

  const { data, error } = await ctx.db
    .from("businesses")
    .select("widget_white_label")
    .eq("id", businessId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { settings: sanitizeSettings((data as { widget_white_label?: unknown })?.widget_white_label) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await context.params;
  const ctx = await requireBusinessAccess(req, businessId);
  if (!ctx.ok) return ctx.response;

  const plan = await getActivePlanKeyForBusiness(businessId, ctx.db);
  if (plan !== "elite") {
    return NextResponse.json(
      { error: "White-label settings are available on Elite only." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const settings = sanitizeSettings((body as { settings?: unknown })?.settings);

  const { error } = await ctx.db
    .from("businesses")
    .update({ widget_white_label: settings })
    .eq("id", businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings });
}
