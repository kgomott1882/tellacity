export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isPaystackCardOnTrialEnabled } from "@/lib/paystackCardOnTrial";
import { completeTrialCardCaptureAndProvision } from "@/lib/paystackTrialCardCapture";
import { getServerEnv } from "@/lib/serverEnv";
import { isBusinessOwner } from "@/lib/businessOwnership";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

/**
 * Paystack card-on-trial (Build 1): verify tokenization txn, provision trial, save authorization.
 */
export async function POST(req: Request) {
  if (!isPaystackCardOnTrialEnabled()) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const businessId =
      typeof body.businessId === "string" ? body.businessId.trim() : "";
    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }
    if (!reference) {
      return NextResponse.json({ error: "reference is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const isOwner = await isBusinessOwner(supabase, access.userId, businessId);
    if (!isOwner) {
      return NextResponse.json({ error: "owner_only" }, { status: 403 });
    }

    const result = await completeTrialCardCaptureAndProvision(
      supabase,
      businessId,
      reference,
    );

    if (!result.ok) {
      if (result.error === "not_eligible") {
        return NextResponse.json({ error: "not_eligible" }, { status: 409 });
      }
      if (result.error === "provision_failed") {
        return NextResponse.json({ error: "provision_failed" }, { status: 500 });
      }
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      plan: result.plan,
      verify_charge_refunded: result.refunded,
    });
  } catch (e) {
    console.error("[billing/start-trial/card/complete] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
