export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_INVITE_LIMITS, getActivePlanKeyForBusiness, type PlanKey } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";

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

    const { supabaseUrl, serviceRoleKey } = getServerEnv();

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Resolve effective plan via subscriptions so usage matches send endpoint
    const effectivePlan: PlanKey = await getActivePlanKeyForBusiness(businessId, supabase);
    const limit = PLAN_INVITE_LIMITS[effectivePlan];

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: monthlyCount } = await supabase
      .from("review_invites")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", startOfMonth.toISOString());

    return NextResponse.json({
      monthlyCount: monthlyCount ?? 0,
      limit,
    });
  } catch (err) {
    console.error("Usage endpoint crash:", err);
    return NextResponse.json(
      { error: "Server crash" },
      { status: 500 }
    );
  }
}

