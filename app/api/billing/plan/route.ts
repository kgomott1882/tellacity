export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActivePlanKeyForBusinessResult } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

/**
 * Current resolved plan for a business (from `subscriptions`, same rules as dashboard).
 * Used to verify upgrade success state against the database.
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const businessId = (url.searchParams.get("businessId") ?? "").trim();
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const result = await getActivePlanKeyForBusinessResult(businessId, supabase);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ plan: result.plan });
  } catch (e) {
    console.error("[billing/plan] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
