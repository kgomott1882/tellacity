import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm, parseBillingCycleQuery } from "@/lib/billingPlanConfirm";
import { computePaystackCurrentPeriodEndIso } from "@/lib/paystackSubscriptionPeriod";
import {
  syncBusinessPlanColumn,
  upsertActiveSubscriptionForBusiness,
} from "@/lib/subscriptionWrite";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const event = body.event;
    const reference = body.data?.reference;

    // 🔹 Store raw webhook (always)
    await supabase.from("paystack_webhook_events").insert({
      event,
      reference,
      payload: body,
    });

    // 🔹 Only handle successful payments
    if (event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const metadata = body.data?.metadata as Record<string, unknown> | undefined;

    const businessId = metadata?.business_id;
    const rawPlan =
      typeof metadata?.plan_code === "string" ? metadata.plan_code.trim().toLowerCase() : "";
    const plan = (rawPlan === "grow" || rawPlan === "premium" || rawPlan === "elite"
      ? rawPlan
      : null) as PaidPlanKey | null;

    if (!businessId || !plan || !isPaidPlanForConfirm(plan)) {
      console.error("[paystack webhook] missing or invalid metadata", metadata);
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    const bid = String(businessId).trim();

    const rawCycle =
      typeof metadata?.billing_cycle === "string" ? metadata.billing_cycle : undefined;
    const cycleStrict = parseBillingCycleQuery(rawCycle, { strict: true });
    const cycle =
      cycleStrict ??
      (() => {
        console.warn(
          "[paystack webhook] metadata.billing_cycle missing or invalid; defaulting to monthly",
          { reference, businessId: bid }
        );
        return parseBillingCycleQuery(undefined);
      })();

    const currentPeriodEndIso = computePaystackCurrentPeriodEndIso(cycle);

    const paystackSubKey =
      typeof reference === "string" && reference.trim() !== ""
        ? reference.trim()
        : undefined;

    const sub = await upsertActiveSubscriptionForBusiness(supabase, {
      businessId: bid,
      planCode: plan,
      provider: "paystack",
      providerSubId: paystackSubKey,
      currentPeriodEndIso,
    });
    if (!sub.ok) {
      console.error("Subscription upsert error:", sub.error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    await syncBusinessPlanColumn(supabase, bid, plan);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Paystack webhook error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
