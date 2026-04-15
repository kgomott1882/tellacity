import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import type { WidgetType } from "@/components/widgets/types";

const WIDGET_TYPES = new Set<WidgetType>([
  "badge",
  "carousel",
  "list",
  "collector",
  "review_us",
  "score_strip",
  "showcase",
  "tellacity_trust",
  "trust_strip",
  "trust_stacked",
  "trust_strip_icon",
  "trust_mini",
  "spotlight_carousel",
  "review_slider",
  "review_dropdown",
  "micro_trustscore",
]);

export type WidgetEmbedSettingsStored = {
  themes?: Partial<Record<WidgetType, "minimal" | "light">>;
  advancedEnabled?: boolean;
  previewSiteBackgroundHex?: string;
};

function isHex6(v: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(v);
}

function sanitizeHexInput(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  if (!t) return "";
  const h = t.startsWith("#") ? t : `#${t}`;
  return isHex6(h) ? h : undefined;
}

function sanitizeThemeValue(v: unknown): "minimal" | "light" | null {
  if (v === "minimal" || v === "light") return v;
  return null;
}

function sanitizeStored(input: unknown): WidgetEmbedSettingsStored {
  const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const themes: Partial<Record<WidgetType, "minimal" | "light">> = {};
  const rawThemes = src.themes;
  if (rawThemes && typeof rawThemes === "object") {
    for (const [k, v] of Object.entries(rawThemes as Record<string, unknown>)) {
      if (!WIDGET_TYPES.has(k as WidgetType)) continue;
      const t = sanitizeThemeValue(v);
      if (t) themes[k as WidgetType] = t;
    }
  }
  const hexRaw = sanitizeHexInput(src.previewSiteBackgroundHex);
  const previewSiteBackgroundHex =
    hexRaw === undefined ? undefined : hexRaw === "" ? "" : hexRaw;

  return {
    themes: Object.keys(themes).length ? themes : undefined,
    advancedEnabled: typeof src.advancedEnabled === "boolean" ? src.advancedEnabled : undefined,
    previewSiteBackgroundHex,
  };
}

function mergePatch(
  existing: WidgetEmbedSettingsStored,
  patch: WidgetEmbedSettingsStored
): WidgetEmbedSettingsStored {
  const next: WidgetEmbedSettingsStored = {
    advancedEnabled: patch.advancedEnabled ?? existing.advancedEnabled ?? false,
    previewSiteBackgroundHex:
      patch.previewSiteBackgroundHex !== undefined
        ? patch.previewSiteBackgroundHex
        : existing.previewSiteBackgroundHex,
    themes: { ...(existing.themes ?? {}) },
  };
  if (patch.themes) {
    for (const [k, v] of Object.entries(patch.themes)) {
      if (!WIDGET_TYPES.has(k as WidgetType)) continue;
      if (v === "minimal" || v === "light") {
        next.themes![k as WidgetType] = v;
      }
    }
  }
  return next;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await context.params;
  const ctx = await requireBusinessAccess(req, businessId);
  if (!ctx.ok) return ctx.response;

  const { data, error } = await ctx.db
    .from("businesses")
    .select("widget_embed_settings")
    .eq("id", businessId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings = sanitizeStored((data as { widget_embed_settings?: unknown })?.widget_embed_settings);

  return NextResponse.json(
    {
      settings: {
        themes: settings.themes ?? {},
        advancedEnabled: settings.advancedEnabled ?? false,
        previewSiteBackgroundHex: settings.previewSiteBackgroundHex ?? "",
      },
    },
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

  const body = await req.json().catch(() => ({}));
  const patch = sanitizeStored((body as { patch?: unknown })?.patch ?? body);

  const { data: row, error: loadErr } = await ctx.db
    .from("businesses")
    .select("widget_embed_settings")
    .eq("id", businessId)
    .single();

  if (loadErr) {
    return NextResponse.json({ error: loadErr.message }, { status: 500 });
  }

  const existing = sanitizeStored((row as { widget_embed_settings?: unknown })?.widget_embed_settings);
  const merged = mergePatch(existing, patch);

  const { error } = await ctx.db
    .from("businesses")
    .update({ widget_embed_settings: merged })
    .eq("id", businessId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    settings: {
      themes: merged.themes ?? {},
      advancedEnabled: merged.advancedEnabled ?? false,
      previewSiteBackgroundHex: merged.previewSiteBackgroundHex ?? "",
    },
  });
}
