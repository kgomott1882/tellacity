export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

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
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({
        pending_plan_code: null,
        pending_change_at: null,
      })
      .eq("business_id", businessId);

    if (updateErr) {
      console.error("[billing/cancel-downgrade] update:", updateErr.message);
      return NextResponse.json({ error: "Could not cancel scheduled downgrade." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[billing/cancel-downgrade] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
