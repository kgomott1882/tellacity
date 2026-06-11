export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm } from "@/lib/billingPlanConfirm";
import {
  decodePaypalCustomId,
  getPaypalAccessToken,
  getPaypalApiBase,
  getValidatedPaypalCredentials,
  parsePaypalUsdValue,
  PAYPAL_CURRENCY,
} from "@/lib/billingPaypal";
import { markCreditsConsumed } from "@/lib/billingCredits";
import { getActivePlanCodeForBusiness } from "@/lib/plans";
import { computePaystackCurrentPeriodEndIso } from "@/lib/paystackSubscriptionPeriod";
import { getServerEnv } from "@/lib/serverEnv";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

type PayPalCaptureResponse = {
  id?: string;
  status?: string;
  purchase_units?: {
    custom_id?: string;
    invoice_id?: string;
    payments?: {
      captures?: {
        id?: string;
        status?: string;
        amount?: { currency_code?: string; value?: string };
      }[];
    };
  }[];
};

export async function POST(req: Request) {
  try {
    getValidatedPaypalCredentials();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PayPal is not configured correctly";
    console.error("[billing/paypal/capture] config:", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const orderId =
      (typeof body.orderId === "string" ? body.orderId.trim() : "") ||
      (typeof body.token === "string" ? body.token.trim() : "");
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";

    if (!orderId) {
      return NextResponse.json({ error: "Missing PayPal order id." }, { status: 400 });
    }
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const token = await getPaypalAccessToken();
    const captureRes = await fetch(
      `${getPaypalApiBase()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureJson = (await captureRes.json().catch(() => ({}))) as PayPalCaptureResponse & {
      message?: string;
      details?: { issue?: string; description?: string }[];
    };

    if (!captureRes.ok) {
      const detail = captureJson.details?.[0];
      const message =
        detail?.description || captureJson.message || "PayPal could not capture the payment.";
      console.error("[billing/paypal/capture]", captureRes.status, captureJson);
      return NextResponse.json({ error: message }, { status: captureRes.status || 502 });
    }

    if (captureJson.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed." }, { status: 400 });
    }

    const unit = captureJson.purchase_units?.[0];
    const meta = decodePaypalCustomId(unit?.custom_id);
    if (!meta || meta.businessId !== businessId) {
      return NextResponse.json(
        { error: "Payment does not match this workspace." },
        { status: 403 }
      );
    }

    const { plan, cycle, creditReference, creditAppliedUsdMinor, listUsdMinor } = meta;
    if (!isPaidPlanForConfirm(plan)) {
      return NextResponse.json({ error: "Invalid plan in payment metadata." }, { status: 400 });
    }

    const capture = unit?.payments?.captures?.[0];
    if (capture?.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment capture was not successful." }, { status: 400 });
    }

    const paidUsdMinor = parsePaypalUsdValue(capture.amount?.value);
    const paidCurrency =
      typeof capture.amount?.currency_code === "string"
        ? capture.amount.currency_code.trim().toUpperCase()
        : "";
    const expectedNetUsdMinor = Math.max(100, listUsdMinor - creditAppliedUsdMinor);

    if (
      paidUsdMinor == null ||
      paidUsdMinor !== expectedNetUsdMinor ||
      paidCurrency !== PAYPAL_CURRENCY
    ) {
      console.warn("[billing/paypal/capture] charge mismatch", {
        orderId,
        businessId,
        plan,
        cycle,
        listUsdMinor,
        creditAppliedUsdMinor,
        expectedNetUsdMinor,
        paidUsdMinor,
        paidCurrency,
      });
      return NextResponse.json(
        { error: "Payment amount or currency does not match the selected plan." },
        { status: 400 }
      );
    }

    const providerSubId = capture.id?.trim() || orderId;
    const creditRef =
      typeof unit?.invoice_id === "string" && unit.invoice_id.trim()
        ? unit.invoice_id.trim()
        : creditReference;

    console.info("[billing/paypal/capture] verification succeeded", {
      orderId,
      providerSubId,
      businessId,
      plan,
      cycle,
      paidUsdMinor,
    });

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: transactionError } = await supabase.from("billing_transactions").upsert(
      {
        business_id: businessId,
        reference: providerSubId,
        amount: paidUsdMinor,
        currency: PAYPAL_CURRENCY,
        status: "success",
        plan_code: plan,
      },
      { onConflict: "reference", ignoreDuplicates: true }
    );
    if (transactionError) {
      console.error("[billing/paypal/capture] billing_transactions:", transactionError.message);
    }

    const currentPeriodEndIso = computePaystackCurrentPeriodEndIso(cycle);

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("plan_code")
      .eq("business_id", businessId)
      .eq("provider_sub_id", providerSubId)
      .maybeSingle();

    if (existingSub && typeof (existingSub as { plan_code?: unknown }).plan_code === "string") {
      const existingPlan = String((existingSub as { plan_code: string }).plan_code).trim();
      const subIdempotent = await upsertActiveSubscriptionForBusiness(supabase, {
        businessId,
        planCode: plan,
        provider: "paypal",
        providerSubId,
        currentPeriodEndIso,
      });
      if (!subIdempotent.ok) {
        console.error("[billing/paypal/capture] idempotent upsert:", subIdempotent.error);
        return NextResponse.json(
          { error: "Could not save subscription after payment." },
          { status: 500 }
        );
      }
      await markCreditsConsumed(supabase, creditRef);
      return NextResponse.json({
        success: true,
        plan: existingPlan as PaidPlanKey,
      });
    }

    const oldPlan = await getActivePlanCodeForBusiness(businessId, supabase);

    const sub = await upsertActiveSubscriptionForBusiness(supabase, {
      businessId,
      planCode: plan,
      provider: "paypal",
      providerSubId,
      currentPeriodEndIso,
    });
    if (!sub.ok) {
      console.error("[billing/paypal/capture] upsert:", sub.error);
      return NextResponse.json(
        { error: "Could not save subscription after payment." },
        { status: 500 }
      );
    }

    await syncBusinessPlanColumn(supabase, businessId, plan);
    await markCreditsConsumed(supabase, creditRef);

    const { error: auditError } = await supabase.from("subscription_changes").insert({
      business_id: businessId,
      old_plan: oldPlan,
      new_plan: plan,
    });
    if (auditError) {
      console.error("[billing/paypal/capture] subscription_changes:", auditError.message);
    }

    return NextResponse.json({ success: true, plan });
  } catch (e) {
    console.error("[billing/paypal/capture] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
