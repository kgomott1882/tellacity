export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { getActivePlanCodeForBusiness } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

function parsePlan(raw: unknown): PaidPlanKey | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim().toLowerCase();
  if (p === "grow" || p === "premium" || p === "elite") return p;
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
    const plan = parsePlan(body.plan);

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }
    if (!plan) {
      return NextResponse.json(
        { error: "plan must be one of: grow, premium, elite." },
        { status: 400 }
      );
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const oldPlan = await getActivePlanCodeForBusiness(businessId, supabase);

    const subResult = await upsertActiveSubscriptionForBusiness(supabase, {
      businessId,
      planCode: plan,
      provider: "dashboard",
    });

    if (!subResult.ok) {
      console.error("[billing/upgrade] subscription upsert:", subResult.error);
      console.error("[billing/upgrade] detail:", subResult.error);
      return NextResponse.json(
        {
          error:
            "Could not save subscription. Ensure `subscriptions` exists and run the backfill SQL from migration 20260623103000_subscriptions_backfill_missing.sql if rows are missing.",
        },
        { status: 500 }
      );
    }

    await syncBusinessPlanColumn(supabase, businessId, plan);

    const { error: auditError } = await supabase.from("subscription_changes").insert({
      business_id: businessId,
      old_plan: oldPlan,
      new_plan: plan,
    });

    if (auditError) {
      console.error(
        "[billing/upgrade] subscription_changes insert failed:",
        auditError.message
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[billing/upgrade] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
