export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
} from "@/lib/billingPlanConfirm";
import { resolvePaystackChargeDetails } from "@/lib/billingPaystack";

/**
 * Public charge preview for a plan (list USD + approx ZAR when applicable).
 * Used by embedded upgrade CTAs so copy matches `/initialize` without creating a transaction.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = parseBillingPlanQuery(url.searchParams.get("plan"));
  const cycle = parseBillingCycleQuery(url.searchParams.get("cycle"));

  if (!plan || !isPaidPlanForConfirm(plan)) {
    return NextResponse.json(
      { error: "plan must be one of: grow, premium, elite." },
      { status: 400 }
    );
  }

  try {
    const d = await resolvePaystackChargeDetails(plan, cycle);
    return NextResponse.json({
      currency: d.currency,
      list_usd: d.listUsdMajor,
      approx_settle_major: d.settleMajor,
      fx_usd_zar: d.fxUsdZar,
    });
  } catch (e) {
    console.error("[billing/paystack/preview]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
