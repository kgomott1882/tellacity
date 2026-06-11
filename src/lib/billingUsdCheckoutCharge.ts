import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import {
  availableCreditsUsdMinor,
  computeProrationCreditUsdMinor,
  ensureProrationCredit,
  fetchActiveSubscriptionMeta,
  isUpgrade,
  MIN_CHARGE_USD_MINOR,
  selectCreditsForCharge,
  type CreditApplication,
} from "@/lib/billingCredits";
import { resolvePaypalChargeDetails } from "@/lib/billingPaypal";

export type UsdCheckoutChargePreview = {
  currency: "USD";
  list_usd: number;
  list_amount_minor: number;
  credit_applied_usd_minor: number;
  credit_applied_amount_minor: number;
  net_amount_minor: number;
  previous_plan_code: string;
  credit_selection: CreditApplication["perCredit"];
};

export async function previewUsdCheckoutCharge(
  db: SupabaseClient,
  businessId: string,
  plan: PaidPlanKey,
  cycle: "monthly" | "annual"
): Promise<UsdCheckoutChargePreview> {
  const charge = resolvePaypalChargeDetails(plan, cycle);
  const listUsdMinor = charge.listUsdMinor;

  const currentSub = await fetchActiveSubscriptionMeta(db, businessId);
  const currentPlanKey = currentSub?.planKey ?? "free";
  const currentPeriodEndIso = currentSub?.currentPeriodEnd ?? null;

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
  const netUsdMinor = Math.max(MIN_CHARGE_USD_MINOR, listUsdMinor - applicableUsdMinor);
  const selection = selectCreditsForCharge(existingRows, applicableUsdMinor);

  return {
    currency: "USD",
    list_usd: charge.listUsdMajor,
    list_amount_minor: listUsdMinor,
    credit_applied_usd_minor: applicableUsdMinor,
    credit_applied_amount_minor: applicableUsdMinor,
    net_amount_minor: netUsdMinor,
    previous_plan_code: currentPlanKey,
    credit_selection: selection.perCredit,
  };
}

export type UsdCheckoutChargeForPayment = UsdCheckoutChargePreview & {
  creditReference: string;
  selection: CreditApplication;
};

/** Same credit rules as Paystack initialize, but amounts stay in USD minor units. */
export async function prepareUsdCheckoutCharge(
  db: SupabaseClient,
  businessId: string,
  plan: PaidPlanKey,
  cycle: "monthly" | "annual",
  creditReference: string
): Promise<UsdCheckoutChargeForPayment> {
  const charge = resolvePaypalChargeDetails(plan, cycle);
  const listUsdMinor = charge.listUsdMinor;

  const currentSub = await fetchActiveSubscriptionMeta(db, businessId);
  const currentPlanKey = currentSub?.planKey ?? "free";
  const currentPeriodEndIso = currentSub?.currentPeriodEnd ?? null;

  if (
    currentSub &&
    currentPeriodEndIso &&
    isUpgrade(currentPlanKey, plan) &&
    currentPlanKey !== "free"
  ) {
    const prorationUsdMinor = computeProrationCreditUsdMinor({
      currentPlan: currentPlanKey,
      currentCycle: cycle,
      currentPeriodEndIso,
    });
    if (prorationUsdMinor > 0) {
      await ensureProrationCredit(db, {
        businessId,
        previousPlan: currentPlanKey,
        newPlan: plan,
        currentCycle: cycle,
        currentPeriodEndIso,
        amountUsdMinor: prorationUsdMinor,
      });
    }
  }

  const maxApplicableUsdMinor = Math.max(0, listUsdMinor - MIN_CHARGE_USD_MINOR);
  const { rows: availableRows } = await availableCreditsUsdMinor(db, businessId);
  const selection = selectCreditsForCharge(availableRows, maxApplicableUsdMinor);
  const creditAppliedUsdMinor = selection.totalAppliedUsdMinor;
  const netUsdMinor = Math.max(MIN_CHARGE_USD_MINOR, listUsdMinor - creditAppliedUsdMinor);

  return {
    currency: "USD",
    list_usd: charge.listUsdMajor,
    list_amount_minor: listUsdMinor,
    credit_applied_usd_minor: creditAppliedUsdMinor,
    credit_applied_amount_minor: creditAppliedUsdMinor,
    net_amount_minor: netUsdMinor,
    previous_plan_code: currentPlanKey,
    credit_selection: selection.perCredit,
    creditReference,
    selection,
  };
}
