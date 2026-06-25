export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildCancelSubscriptionMarkers,
  canCancelSubscriptionRow,
  hasCancelledAtTimestamp,
} from "@/lib/billingCancelSubscription";
import { isPaystackCardOnTrialEnabled } from "@/lib/paystackCardOnTrial";
import { isBusinessOwner } from "@/lib/businessOwnership";
import { normalizePlanCodeToKey, pickPlanResolutionSubscriptionRow } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

const SUBSCRIPTION_SELECT =
  "plan_code, status, updated_at, current_period_end, cancelled_at, pending_plan_code, paystack_authorization_code, trial_card_captured_at, recurring_billing_enabled, reverse_trial_used_at";

export async function POST(req: Request) {
  try {
    if (!isPaystackCardOnTrialEnabled()) {
      return NextResponse.json({ error: "feature_disabled" }, { status: 403 });
    }

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

    const isOwner = await isBusinessOwner(supabase, access.userId, businessId);
    if (!isOwner) {
      return NextResponse.json({ error: "owner_only" }, { status: 403 });
    }

    const { data: subRows, error: subErr } = await supabase
      .from("subscriptions")
      .select(SUBSCRIPTION_SELECT)
      .eq("business_id", businessId);

    if (subErr) {
      console.error("[billing/cancel-subscription] subscriptions:", subErr.message);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const picked = pickPlanResolutionSubscriptionRow(subRows ?? []);
    if (!picked) {
      return NextResponse.json(
        { error: "No active subscription found for this workspace." },
        { status: 404 },
      );
    }

    const plan = normalizePlanCodeToKey(picked.plan_code);
    const status = String(picked.status ?? "").trim().toLowerCase();

    if (plan === "free" && status !== "trialing") {
      return NextResponse.json(
        { error: "already_free", message: "You are already on the Free plan." },
        { status: 400 },
      );
    }

    if (hasCancelledAtTimestamp(picked.cancelled_at)) {
      return NextResponse.json(
        { error: "already_cancelled", message: "This subscription is already cancelled." },
        { status: 409 },
      );
    }

    if (!canCancelSubscriptionRow(picked)) {
      return NextResponse.json(
        {
          error: "not_cancellable",
          message:
            "This subscription cannot be cancelled here. Manual checkout subscriptions expire at period end without recurring billing.",
        },
        { status: 400 },
      );
    }

    const periodEndIso = String(picked.current_period_end).trim();
    const markers = buildCancelSubscriptionMarkers(periodEndIso);

    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({
        ...markers,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", businessId);

    if (updateErr) {
      console.error("[billing/cancel-subscription] update:", updateErr.message);
      return NextResponse.json({ error: "Could not cancel subscription." }, { status: 500 });
    }

    const cancelCase = status === "trialing" ? "trial" : "recurring";

    return NextResponse.json({
      success: true,
      case: cancelCase,
      access_ends_at: periodEndIso,
      pending_plan_code: "free",
      pending_change_at: periodEndIso,
    });
  } catch (e) {
    console.error("[billing/cancel-subscription] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
