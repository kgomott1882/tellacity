export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMonthlyInviteLimitForBusiness } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "Missing businessId" },
        { status: 400 }
      );
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const limit = await getMonthlyInviteLimitForBusiness(businessId, supabase);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);
    const monthStartIso = startOfMonth.toISOString();

    const [
      { count: monthlyCount },
      { count: sentThisMonth },
      { count: deliveredThisMonth },
    ] = await Promise.all([
      supabase
        .from("review_invites")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("created_at", monthStartIso)
        .or("source.is.null,source.neq.email_widget"),
      supabase
        .from("review_invites")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .not("sent_at", "is", null)
        .gte("sent_at", monthStartIso)
        .or("source.is.null,source.neq.email_widget"),
      supabase
        .from("review_invites")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .not("opened_at", "is", null)
        .gte("opened_at", monthStartIso)
        .or("source.is.null,source.neq.email_widget"),
    ]);

    return NextResponse.json({
      monthlyCount: monthlyCount ?? 0,
      limit,
      sentThisMonth: sentThisMonth ?? 0,
      deliveredThisMonth: deliveredThisMonth ?? 0,
    });
  } catch (err) {
    console.error("Usage endpoint crash:", err);
    return NextResponse.json(
      { error: "Server crash" },
      { status: 500 }
    );
  }
}

