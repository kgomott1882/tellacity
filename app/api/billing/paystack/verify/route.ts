export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm, parseBillingCycleQuery } from "@/lib/billingPlanConfirm";
import { getValidatedPaystackSecret, resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import { getActivePlanCodeForBusiness } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { computePaystackCurrentPeriodEndIso } from "@/lib/paystackSubscriptionPeriod";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";
import { markCreditsConsumed } from "@/lib/billingCredits";

type PaystackVerifyResponse = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    amount?: number;
    currency?: string;
    metadata?: {
      business_id?: string;
      plan_code?: string;
      billing_cycle?: string;
      credit_applied_amount_minor?: string | number;
      credit_applied_usd_minor?: string | number;
    };
  };
};

function parseIntegerMeta(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  if (typeof raw === "string") {
    const n = Number.parseInt(raw.trim(), 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeCurrency(code: unknown): string {
  const s = typeof code === "string" ? code.trim().toUpperCase() : "";
  return s.length >= 3 ? s.slice(0, 3) : "";
}

export async function POST(req: Request) {
  try {
    let PAYSTACK_SECRET: string;
    try {
      PAYSTACK_SECRET = getValidatedPaystackSecret();
    } catch (error) {
      console.error("[billing/paystack/verify] config:", error);
      return NextResponse.json(
        { error: "Paystack is not configured correctly" },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const reference =
      searchParams.get("reference")?.trim() ||
      searchParams.get("trxref")?.trim() ||
      searchParams.get("txref")?.trim() ||
      (typeof body.reference === "string" ? body.reference.trim() : "");
    const businessId =
      typeof body.businessId === "string" ? body.businessId.trim() : "";

    if (!reference) {
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 }
      );
    }
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );
    const data = (await verifyRes.json()) as PaystackVerifyResponse;

    if (!verifyRes.ok) {
      console.error("[billing/paystack/verify]", verifyRes.status, data);
      return NextResponse.json(
        { error: typeof data.message === "string" ? data.message : "Payment not verified." },
        { status: 400 }
      );
    }

    if (data?.data?.status !== "success") {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }

    const payload = data;

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

    // Verify must not default or guess billing_cycle: wrong value would pass amount checks while mis-grading the subscription.
    const rawBillingCycle = meta.billing_cycle;
    const cycle = parseBillingCycleQuery(
      typeof rawBillingCycle === "string" ? rawBillingCycle : undefined,
      { strict: true }
    );
    if (cycle === null) {
      return NextResponse.json(
        { error: "Transaction metadata is missing or invalid billing_cycle." },
        { status: 400 }
      );
    }

    const expected = await resolvePaystackChargeDetails(plan, cycle);
    const paidMinor =
      typeof payload.data?.amount === "number" && Number.isFinite(payload.data.amount)
        ? Math.round(payload.data.amount)
        : NaN;
    const paidCurrency = normalizeCurrency(payload.data?.currency);

    // Mid-cycle upgrades applied a credit at /initialize; the paid amount equals
    // (list - credit). Metadata is authoritative for the credit amount.
    const creditAppliedAmountMinor = Math.max(
      0,
      parseIntegerMeta(meta.credit_applied_amount_minor)
    );
    const expectedNetMinor = Math.max(100, expected.amountMinor - creditAppliedAmountMinor);

    if (
      !Number.isFinite(paidMinor) ||
      paidMinor !== expectedNetMinor ||
      paidCurrency !== expected.currency
    ) {
      console.warn("[billing/paystack/verify] charge mismatch", {
        reference,
        businessId,
        plan,
        cycle,
        expectedAmountMinor: expected.amountMinor,
        expectedNetMinor,
        creditAppliedAmountMinor,
        expectedCurrency: expected.currency,
        paidMinor,
        paidCurrency,
      });
      return NextResponse.json(
        { error: "Payment amount or currency does not match the selected plan." },
        { status: 400 }
      );
    }

    console.info("[billing/paystack/verify] verification succeeded", {
      reference,
      businessId,
      plan,
      cycle,
      amountMinor: paidMinor,
      currency: paidCurrency,
    });

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: transactionError } = await supabase
      .from("billing_transactions")
      .upsert(
        {
          business_id: businessId,
          reference,
          amount: paidMinor,
          currency: paidCurrency,
          status: "success",
          plan_code: plan,
        },
        { onConflict: "reference", ignoreDuplicates: true }
      );
    if (transactionError) {
      // Do not block a verified subscription upgrade on auxiliary ledger writes.
      console.error("[billing/paystack/verify] billing_transactions:", transactionError.message);
    } else {
      console.info("[billing/paystack/verify] transaction recorded", {
        reference,
        businessId,
        plan,
        amountMinor: paidMinor,
        currency: paidCurrency,
      });
    }

    const currentPeriodEndIso = computePaystackCurrentPeriodEndIso(cycle);

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("plan_code")
      .eq("business_id", businessId)
      .eq("provider_sub_id", reference)
      .maybeSingle();

    if (existingSub && typeof (existingSub as { plan_code?: unknown }).plan_code === "string") {
      const existingPlan = String((existingSub as { plan_code: string }).plan_code).trim();
      console.info("[billing/paystack/verify] idempotent, subscription already recorded", {
        reference,
        businessId,
        plan: existingPlan,
      });
      const subIdempotent = await upsertActiveSubscriptionForBusiness(supabase, {
        businessId,
        planCode: plan,
        provider: "paystack",
        providerSubId: reference,
        currentPeriodEndIso,
      });
      if (!subIdempotent.ok) {
        console.error("[billing/paystack/verify] idempotent upsert:", subIdempotent.error);
        return NextResponse.json(
          { error: "Could not save subscription after payment." },
          { status: 500 }
        );
      }
      await markCreditsConsumed(supabase, reference);
      return NextResponse.json({
        success: true,
        plan: existingPlan as PaidPlanKey,
      });
    }

    const oldPlan = await getActivePlanCodeForBusiness(businessId, supabase);

    const sub = await upsertActiveSubscriptionForBusiness(supabase, {
      businessId,
      planCode: plan,
      provider: "paystack",
      providerSubId: reference,
      currentPeriodEndIso,
    });
    if (!sub.ok) {
      console.error("[billing/paystack/verify] upsert:", sub.error);
      return NextResponse.json({ error: "Could not save subscription after payment." }, { status: 500 });
    }

    console.info("[billing/paystack/verify] subscription row updated", {
      reference,
      businessId,
      plan,
    });

    await syncBusinessPlanColumn(supabase, businessId, plan);

    await markCreditsConsumed(supabase, reference);

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
