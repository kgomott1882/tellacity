export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  canUncancelSubscriptionRow,
  hasCancelledAtTimestamp,
  hasCardOnTrialCapture,
} from "@/lib/billingCancelSubscription";
import { isBusinessOwner } from "@/lib/businessOwnership";
import { pickPlanResolutionSubscriptionRow } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

const SUBSCRIPTION_SELECT =
  "plan_code, status, updated_at, current_period_end, cancelled_at, pending_plan_code, paystack_authorization_code, trial_card_captured_at, recurring_billing_enabled";

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

    const { data: subRows, error: subErr } = await supabase
      .from("subscriptions")
      .select(SUBSCRIPTION_SELECT)
      .eq("business_id", businessId);

    if (subErr) {
      console.error("[billing/cancel-downgrade] subscriptions:", subErr.message);
      return NextResponse.json({ error: subErr.message }, { status: 500 });
    }

    const picked = pickPlanResolutionSubscriptionRow(subRows ?? []);

    if (picked && hasCancelledAtTimestamp(picked.cancelled_at)) {
      const isOwner = await isBusinessOwner(supabase, access.userId, businessId);
      if (!isOwner) {
        return NextResponse.json({ error: "owner_only" }, { status: 403 });
      }

      if (!canUncancelSubscriptionRow(picked)) {
        return NextResponse.json(
          {
            error: "cannot_uncancel",
            message:
              "This cancellation can no longer be reversed. Subscribe again via checkout if you need a paid plan.",
          },
          { status: 400 },
        );
      }

      const now = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("subscriptions")
        .update({
          cancelled_at: null,
          pending_plan_code: null,
          pending_change_at: null,
          recurring_billing_enabled: hasCardOnTrialCapture(picked),
          updated_at: now,
        })
        .eq("business_id", businessId);

      if (updateErr) {
        console.error("[billing/cancel-downgrade] uncancel:", updateErr.message);
        return NextResponse.json({ error: "Could not restore subscription." }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "uncancelled_subscription" });
    }

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

    return NextResponse.json({ success: true, action: "cleared_pending_downgrade" });
  } catch (e) {
    console.error("[billing/cancel-downgrade] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
