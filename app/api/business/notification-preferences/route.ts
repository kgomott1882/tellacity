import { NextResponse } from "next/server";
import {
  canAccessBusiness,
  resolveDashboardDb,
} from "@/lib/supabase/businessDashboardServer";

export const runtime = "nodejs";

const DEFAULTS = {
  newsletter_enabled: false,
  notify_1_2_star: true,
  notify_3_star: true,
  notify_4_5_star: true,
} as const;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("businessId")?.trim() ?? "";
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId." }, { status: 400 });
    }

    const auth = await resolveDashboardDb(req);
    if (!auth.ok) return auth.response;

    const allowed = await canAccessBusiness(auth.db, auth.userId, businessId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data, error } = await auth.db
      .from("business_notification_preferences")
      .select(
        "newsletter_enabled, notify_1_2_star, notify_3_star, notify_4_5_star"
      )
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      console.error("NOTIFICATION PREF ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ...DEFAULTS });
    }

    return NextResponse.json({
      newsletter_enabled: data.newsletter_enabled ?? DEFAULTS.newsletter_enabled,
      notify_1_2_star: data.notify_1_2_star ?? DEFAULTS.notify_1_2_star,
      notify_3_star: data.notify_3_star ?? DEFAULTS.notify_3_star,
      notify_4_5_star: data.notify_4_5_star ?? DEFAULTS.notify_4_5_star,
    });
  } catch (err) {
    console.error("NOTIFICATION PREF ERROR:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const businessId =
      typeof body.businessId === "string" ? body.businessId.trim() : "";
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId." }, { status: 400 });
    }

    const fields = [
      "newsletter_enabled",
      "notify_1_2_star",
      "notify_3_star",
      "notify_4_5_star",
    ] as const;
    const row: Record<string, unknown> = {};
    for (const key of fields) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json({ error: `Invalid or missing ${key}.` }, { status: 400 });
      }
      row[key] = body[key];
    }

    const auth = await resolveDashboardDb(req);
    if (!auth.ok) return auth.response;

    const allowed = await canAccessBusiness(auth.db, auth.userId, businessId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error } = await auth.db.from("business_notification_preferences").upsert(
      {
        business_id: businessId,
        newsletter_enabled: row.newsletter_enabled,
        notify_1_2_star: row.notify_1_2_star,
        notify_3_star: row.notify_3_star,
        notify_4_5_star: row.notify_4_5_star,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" }
    );

    if (error) {
      console.error("NOTIFICATION PREF ERROR:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("NOTIFICATION PREF ERROR:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
