export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
} from "@/lib/billingPlanConfirm";
import { previewUsdCheckoutCharge } from "@/lib/billingUsdCheckoutCharge";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = parseBillingPlanQuery(url.searchParams.get("plan"));
  const cycle = parseBillingCycleQuery(url.searchParams.get("cycle"));
  const businessId = url.searchParams.get("businessId")?.trim() ?? "";

  if (!plan || !isPaidPlanForConfirm(plan)) {
    return NextResponse.json(
      { error: "plan must be one of: grow, premium, elite." },
      { status: 400 }
    );
  }

  try {
    if (!businessId) {
      const charge = await import("@/lib/billingPaypal").then((m) =>
        m.resolvePaypalChargeDetails(plan, cycle)
      );
      return NextResponse.json({
        currency: "USD",
        list_usd: charge.listUsdMajor,
        list_amount_minor: charge.listUsdMinor,
        credit_applied_usd_minor: 0,
        credit_applied_amount_minor: 0,
        net_amount_minor: charge.listUsdMinor,
        previous_plan_code: "free",
      });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const db = createClient(supabaseUrl, serviceRoleKey);
    const preview = await previewUsdCheckoutCharge(db, businessId, plan, cycle);
    return NextResponse.json(preview);
  } catch (e) {
    console.error("[billing/paypal/preview]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
