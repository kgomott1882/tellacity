export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { isPlanDowngrade, isPlanUpgrade } from "@/lib/billingPlanRank";
import {
  normalizePlanCodeToKey,
  pickPlanResolutionSubscriptionRow,
  type PlanKey,
} from "@/lib/plans";

function parseTargetPlan(raw: unknown): PlanKey | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim().toLowerCase();
  if (p === "free" || p === "grow" || p === "premium" || p === "elite") return p;
  return null;
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
    const targetPlan = parseTargetPlan(body.targetPlan);

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }
    if (!targetPlan) {
      return NextResponse.json(
        { error: "targetPlan must be one of: free, grow, premium, elite." },
        { status: 400 }
      );
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: subRows, error: subErr } = await supabase
      .from("subscriptions")
      .select("plan_code, current_period_end, pending_plan_code, status, updated_at")
      .eq("business_id", businessId);

    if (subErr) {
      console.error("[billing/downgrade] subscriptions:", subErr.message);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const picked = pickPlanResolutionSubscriptionRow(subRows ?? []);
    if (!picked) {
      return NextResponse.json(
        { error: "No active subscription found for this workspace." },
        { status: 404 }
      );
    }

    const currentPlan = normalizePlanCodeToKey(
      typeof picked.plan_code === "string" ? picked.plan_code : null
    );

    if (targetPlan === currentPlan) {
      return NextResponse.json(
        { error: "You are already on this plan." },
        { status: 400 }
      );
    }

    if (isPlanUpgrade(targetPlan, currentPlan)) {
      return NextResponse.json(
        { error: "Use checkout to upgrade to a higher plan." },
        { status: 400 }
      );
    }

    if (!isPlanDowngrade(targetPlan, currentPlan)) {
      return NextResponse.json({ error: "Invalid plan change." }, { status: 400 });
    }

    const periodEndRaw = (picked as { current_period_end?: string | null }).current_period_end;
    if (periodEndRaw == null || String(periodEndRaw).trim() === "") {
      return NextResponse.json(
        {
          error:
            "Your billing period end is not set yet. Try again after checkout completes, or contact support.",
        },
        { status: 400 }
      );
    }

    const pendingChangeAt = String(periodEndRaw).trim();

    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({
        pending_plan_code: targetPlan,
        pending_change_at: pendingChangeAt,
      })
      .eq("business_id", businessId);

    if (updateErr) {
      console.error("[billing/downgrade] update:", updateErr.message);
      return NextResponse.json({ error: "Could not schedule downgrade." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      current_plan: currentPlan,
      target_plan: targetPlan,
      pending_change_at: pendingChangeAt,
    });
  } catch (e) {
    console.error("[billing/downgrade] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
