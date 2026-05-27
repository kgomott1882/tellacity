export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  isPaidPlanForConfirm,
  parseBillingCycleQuery,
  parseBillingPlanQuery,
} from "@/lib/billingPlanConfirm";
import { resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import {
  availableCreditsUsdMinor,
  computeProrationCreditUsdMinor,
  fetchActiveSubscriptionMeta,
  isUpgrade,
  MIN_CHARGE_USD_MINOR,
  selectCreditsForCharge,
} from "@/lib/billingCredits";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

/**
 * Public charge preview for a plan (list USD + approx ZAR when applicable).
 * When called with `businessId`, also returns the pro-ration credit that will
 * be applied at /initialize so UI can show an accurate "amount due today".
 */
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
    const d = await resolvePaystackChargeDetails(plan, cycle);
    const listAmountMinor = d.amountMinor;
    const listUsdMinor = Math.max(0, Math.round(d.listUsdMajor * 100));

    const base = {
      currency: d.currency,
      list_usd: d.listUsdMajor,
      list_amount_minor: listAmountMinor,
      approx_settle_major: d.settleMajor,
      fx_usd_zar: d.fxUsdZar,
    };

    if (!businessId) {
      return NextResponse.json({
        ...base,
        credit_applied_usd_minor: 0,
        credit_applied_amount_minor: 0,
        net_amount_minor: listAmountMinor,
        previous_plan_code: "free",
      });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const db = createClient(supabaseUrl, serviceRoleKey);

    const currentSub = await fetchActiveSubscriptionMeta(db, businessId);
    const currentPlanKey = currentSub?.planKey ?? "free";
    const currentPeriodEndIso = currentSub?.currentPeriodEnd ?? null;

    // Estimate the proration credit we'd mint on /initialize. We only mint new
    // rows in the real initialize path, here we just project the total.
    let projectedCreditUsdMinor = 0;
    if (
      currentSub &&
      currentPeriodEndIso &&
      isUpgrade(currentPlanKey, plan) &&
      currentPlanKey !== "free"
    ) {
      projectedCreditUsdMinor = computeProrationCreditUsdMinor({
        currentPlan: currentPlanKey,
        currentCycle: cycle,
        currentPeriodEndIso,
      });
    }

    const { total: existingCreditUsdMinor, rows: existingRows } =
      await availableCreditsUsdMinor(db, businessId);

    // If the user already has a live proration credit for this period, avoid
    // double-counting, take the larger of the two as the credit available now.
    const hasLiveProrationForPeriod = existingRows.some(
      (r) =>
        r.source === "proration" &&
        r.current_period_end === currentPeriodEndIso &&
        r.remaining_usd_minor > 0
    );

    const totalAvailableUsdMinor = hasLiveProrationForPeriod
      ? existingCreditUsdMinor
      : existingCreditUsdMinor + projectedCreditUsdMinor;

    const maxApplicableUsdMinor = Math.max(0, listUsdMinor - MIN_CHARGE_USD_MINOR);
    const applicableUsdMinor = Math.min(totalAvailableUsdMinor, maxApplicableUsdMinor);

    // Convert USD credit to charge currency using the same ratio as list.
    const creditRatio = listUsdMinor > 0 ? applicableUsdMinor / listUsdMinor : 0;
    const creditAppliedAmountMinor = Math.round(listAmountMinor * creditRatio);
    const netAmountMinor = Math.max(100, listAmountMinor - creditAppliedAmountMinor);

    // Preview existing credit selection for transparency (oldest first).
    const selection = selectCreditsForCharge(existingRows, applicableUsdMinor);

    return NextResponse.json({
      ...base,
      previous_plan_code: currentPlanKey,
      current_period_end: currentPeriodEndIso,
      projected_proration_usd_minor: projectedCreditUsdMinor,
      existing_available_usd_minor: existingCreditUsdMinor,
      credit_applied_usd_minor: applicableUsdMinor,
      credit_applied_amount_minor: creditAppliedAmountMinor,
      net_amount_minor: netAmountMinor,
      credit_selection: selection.perCredit,
    });
  } catch (e) {
    console.error("[billing/paystack/preview]", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
