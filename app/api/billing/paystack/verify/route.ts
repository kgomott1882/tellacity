export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm } from "@/lib/billingPlanConfirm";
import { getActivePlanCodeForBusiness } from "@/lib/plans";
import { paystackSecretKeyCandidates } from "@/lib/billingPaystack";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    metadata?: { business_id?: string; plan_code?: string };
  };
};

export async function POST(req: Request) {
  try {
    const secretCandidates = paystackSecretKeyCandidates();
    if (secretCandidates.length === 0) {
      return NextResponse.json(
        {
          error:
            "Paystack is not configured (missing or invalid PAYSTACK_SECRET_KEY; expected sk_test_* or sk_live_*).",
        },
        { status: 503 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const reference =
      typeof body.reference === "string" ? body.reference.trim() : "";
    const businessId =
      typeof body.businessId === "string" ? body.businessId.trim() : "";

    if (!reference) {
      return NextResponse.json({ error: "reference is required." }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    let payload: PaystackVerifyResponse = {};
    let verifyStatus = 400;
    let verified = false;
    for (const secret of secretCandidates) {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: { Authorization: `Bearer ${secret}` },
        }
      );
      payload = (await verifyRes.json()) as PaystackVerifyResponse;
      verifyStatus = verifyRes.status;

      verified =
        verifyRes.ok &&
        payload.status === true &&
        String(payload.data?.status).toLowerCase() === "success";
      if (verified) break;

      const message = typeof payload.message === "string" ? payload.message : "";
      const isInvalidKeyMessage = /invalid\s+key/i.test(message);
      if (!isInvalidKeyMessage) break;
    }
    if (!verified) {
      console.error("[billing/paystack/verify]", verifyStatus, payload);
      return NextResponse.json(
        { error: typeof payload.message === "string" ? payload.message : "Payment not verified." },
        { status: 400 }
      );
    }

    const meta = payload.data?.metadata ?? {};
    const metaBiz =
      typeof meta.business_id === "string" ? meta.business_id.trim() : "";
    const rawPlan = typeof meta.plan_code === "string" ? meta.plan_code.trim().toLowerCase() : "";
    const plan = (rawPlan === "grow" || rawPlan === "premium" || rawPlan === "elite"
      ? rawPlan
      : null) as PaidPlanKey | null;

    if (!plan || !isPaidPlanForConfirm(plan)) {
      return NextResponse.json(
        { error: "Transaction metadata is missing a valid plan." },
        { status: 400 }
      );
    }

    if (!metaBiz || metaBiz !== businessId) {
      return NextResponse.json(
        { error: "Transaction does not match this workspace." },
        { status: 403 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const oldPlan = await getActivePlanCodeForBusiness(businessId, supabase);

    const sub = await upsertActiveSubscriptionForBusiness(supabase, {
      businessId,
      planCode: plan,
      provider: "paystack",
      providerSubId: reference,
    });
    if (!sub.ok) {
      console.error("[billing/paystack/verify] upsert:", sub.error);
      return NextResponse.json({ error: "Could not save subscription after payment." }, { status: 500 });
    }

    await syncBusinessPlanColumn(supabase, businessId, plan);

    const { error: auditError } = await supabase.from("subscription_changes").insert({
      business_id: businessId,
      old_plan: oldPlan,
      new_plan: plan,
    });
    if (auditError) {
      console.error("[billing/paystack/verify] subscription_changes:", auditError.message);
    }

    return NextResponse.json({ success: true, plan });
  } catch (e) {
    console.error("[billing/paystack/verify] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
