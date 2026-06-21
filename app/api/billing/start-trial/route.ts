export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { isBusinessOwner } from "@/lib/businessOwnership";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  getReverseTrialEligibility,
  provisionReverseTrialIfEligible,
  type ReverseTrialIneligibilityReason,
} from "@/lib/provisionReverseTrial";

function mapProvisionReasonToIneligibility(
  reason: "not_free" | "subscription_exists",
): ReverseTrialIneligibilityReason {
  if (reason === "not_free") return "not_free";
  return "paid_or_real_subscription";
}

/**
 * User-triggered 14-day Grow reverse trial. Owner-only; no card required.
 */
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

    const { data: businessRow, error: businessErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .maybeSingle();

    if (businessErr) {
      console.error("[billing/start-trial] businesses lookup:", businessErr.message);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    if (!businessRow) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const isOwner = await isBusinessOwner(supabase, access.userId, businessId);
    if (!isOwner) {
      return NextResponse.json({ error: "owner_only" }, { status: 403 });
    }

    const eligibility = await getReverseTrialEligibility(businessId, supabase);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: "not_eligible", reason: eligibility.reason },
        { status: 409 },
      );
    }

    const result = await provisionReverseTrialIfEligible(businessId, supabase);

    if (result.provisioned) {
      return NextResponse.json({ ok: true, plan: "grow" });
    }

    if (result.reason === "not_free" || result.reason === "subscription_exists") {
      return NextResponse.json(
        {
          error: "not_eligible",
          reason: mapProvisionReasonToIneligibility(result.reason),
        },
        { status: 409 },
      );
    }

    console.error("[billing/start-trial] provision failed:", result.reason);
    return NextResponse.json({ error: "provision_failed" }, { status: 500 });
  } catch (e) {
    console.error("[billing/start-trial] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
