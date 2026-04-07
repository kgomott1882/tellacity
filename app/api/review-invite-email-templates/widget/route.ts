export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import {
  canAccessBusiness,
  resolveDashboardDb,
} from "@/lib/supabase/businessDashboardServer";
import { normalizePlanCodeToKey } from "@/lib/plans";

const DEFAULT_WIDGET_SUBJECT = "Share your experience with us";
const DEFAULT_WIDGET_INTRO = "We\u2019d love to hear about your experience. It only takes a minute.";

/** Postgres 23514 + layout_style_check = DB never migrated for `review_card`. */
function layoutStyleConstraintSaveError(err: { message?: string; code?: string } | null) {
  const msg = err?.message ?? "";
  if (
    msg.includes("review_invite_email_templates_layout_style_check") ||
    (err?.code === "23514" && msg.includes("layout_style"))
  ) {
    return NextResponse.json(
      {
        error:
          "This layout needs an updated database rule for layout_style. In Supabase → SQL Editor, run: drop/add review_invite_email_templates_layout_style_check to include all allowed values (see supabase/migrations/20260613120000_review_invite_email_templates_layout_rating_ladder.sql).",
        code: "layout_style_schema",
      },
      { status: 503 },
    );
  }
  return null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const WIDGET_SELECT =
  "subject, intro_message, layout_style, signature_enabled, signature_name";

/**
 * GET — load widget email template + logo for the current business (session + team access).
 * Uses service role after access check so RLS mismatches never block the dashboard.
 */
export async function GET(req: Request) {
  const ctx = await resolveDashboardDb(req);
  if (!ctx.ok) return ctx.response;

  const url = new URL(req.url);
  const businessId = (url.searchParams.get("businessId") ?? "").trim();
  if (!isUuid(businessId)) {
    return NextResponse.json({ error: "Invalid business id." }, { status: 400 });
  }

  const allowed = await canAccessBusiness(ctx.db, ctx.userId, businessId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: tmpl, error: tmplErr }, { data: biz, error: bizErr }] =
      await Promise.all([
        admin
          .from("review_invite_email_templates")
          .select(WIDGET_SELECT)
          .eq("business_id", businessId)
          .eq("template_key", "widget")
          .maybeSingle(),
        admin
          .from("businesses")
          .select("logo_url")
          .eq("id", businessId)
          .maybeSingle(),
      ]);

    if (tmplErr) {
      console.error("[widget template GET] template:", tmplErr);
      return NextResponse.json(
        { error: "Failed to load widget template." },
        { status: 500 },
      );
    }
    if (bizErr) {
      console.error("[widget template GET] business:", bizErr);
      return NextResponse.json(
        { error: "Failed to load business." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      template: tmpl,
      logo_url: (biz as { logo_url?: string | null } | null)?.logo_url ?? null,
    });
  } catch (e) {
    console.error("[widget template GET]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

/**
 * POST — set widget layout_style (standard | elite_branded | review_card | rating_ladder).
 * review_card & rating_ladder: Premium or Elite. elite_branded: Elite only.
 */
export async function POST(req: Request) {
  const ctx = await resolveDashboardDb(req);
  if (!ctx.ok) return ctx.response;

  let payload: { businessId?: string; layoutStyle?: string };
  try {
    payload = (await req.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const businessId =
    typeof payload.businessId === "string" ? payload.businessId.trim() : "";
  const layoutStyle =
    typeof payload.layoutStyle === "string" ? payload.layoutStyle.trim() : "";

  if (!isUuid(businessId)) {
    return NextResponse.json({ error: "Invalid business id." }, { status: 400 });
  }
  if (
    layoutStyle !== "standard" &&
    layoutStyle !== "elite_branded" &&
    layoutStyle !== "review_card" &&
    layoutStyle !== "rating_ladder"
  ) {
    return NextResponse.json({ error: "Invalid layout style." }, { status: 400 });
  }

  const allowed = await canAccessBusiness(ctx.db, ctx.userId, businessId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing, error: existingErr } = await supabase
      .from("review_invite_email_templates")
      .select("subject, intro_message, body")
      .eq("business_id", businessId)
      .eq("template_key", "widget")
      .maybeSingle();

    if (existingErr) {
      console.error("WIDGET SAVE ERROR:", existingErr);
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }

    const subject = existing?.subject || DEFAULT_WIDGET_SUBJECT;
    const intro_message = existing?.intro_message || DEFAULT_WIDGET_INTRO;
    const body = existing?.body || "";

    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("plan_code")
      .eq("business_id", businessId)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (subErr) {
      console.error("WIDGET SAVE ERROR:", subErr);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const normalizedPlan = normalizePlanCodeToKey(sub?.plan_code);

    let effectiveLayout: string;
    if (normalizedPlan === "elite") {
      effectiveLayout = layoutStyle;
    } else if (normalizedPlan === "premium") {
      effectiveLayout =
        layoutStyle === "elite_branded" ? "standard" : layoutStyle;
    } else {
      effectiveLayout = "standard";
    }

    const { error: upsertErr } = await supabase
      .from("review_invite_email_templates")
      .upsert(
        {
          business_id: businessId,
          template_key: "widget",
          template_type: "email_widget",
          subject,
          intro_message,
          body,
          layout_style: effectiveLayout,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,template_key" },
      );

    if (upsertErr) {
      console.error("WIDGET SAVE ERROR:", upsertErr);
      const constraintResp = layoutStyleConstraintSaveError(upsertErr);
      if (constraintResp) return constraintResp;
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WIDGET SAVE ERROR:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Server error.",
      },
      { status: 500 },
    );
  }
}
