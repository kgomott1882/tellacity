export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm, parseBillingCycleQuery } from "@/lib/billingPlanConfirm";
import { buildPaystackBillingReturnCallbackUrl } from "@/lib/billingPaystackCallback";
import { getValidatedPaystackSecret, resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import {
  availableCreditsUsdMinor,
  computeProrationCreditUsdMinor,
  ensureProrationCredit,
  isUpgrade,
  MIN_CHARGE_USD_MINOR,
  fetchActiveSubscriptionMeta,
  releasePendingCredits,
  reserveCreditSelection,
  selectCreditsForCharge,
} from "@/lib/billingCredits";

function parsePlan(raw: unknown): PaidPlanKey | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim().toLowerCase();
  if (p === "grow" || p === "premium" || p === "elite") return p;
  return null;
}

type PaystackInitResponse = {
  status?: boolean;
  message?: string;
  data?: { access_code?: string; authorization_url?: string; reference?: string };
};

function isLikelyValidEmail(raw: string): boolean {
  const s = raw.trim();
  return s.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/**
 * Paystack requires a valid customer email on initialize.
 * Priority: auth.users email → profiles.email → businesses.email → session email → PAYSTACK_CHECKOUT_FALLBACK_EMAIL (optional).
 */
async function resolveCustomerEmailForPaystack(
  userId: string,
  businessId: string
): Promise<string | null> {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(userId);
  if (!authErr) {
    const authEmail = authData?.user?.email?.trim();
    if (authEmail && isLikelyValidEmail(authEmail)) {
      return authEmail;
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  const profileEmail =
    profile && typeof (profile as { email?: unknown }).email === "string"
      ? (profile as { email: string }).email.trim()
      : "";
  if (profileEmail && isLikelyValidEmail(profileEmail)) {
    return profileEmail;
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("email")
    .eq("id", businessId)
    .maybeSingle();
  const bizEmail =
    business && typeof (business as { email?: unknown }).email === "string"
      ? (business as { email: string }).email.trim()
      : "";
  if (bizEmail && isLikelyValidEmail(bizEmail)) {
    return bizEmail;
  }

  return null;
}

export async function POST(req: Request) {
  try {
    let PAYSTACK_SECRET: string;
    try {
      PAYSTACK_SECRET = getValidatedPaystackSecret();
    } catch (error) {
      console.error("[billing/paystack/initialize] config:", error);
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

    const businessId =
      typeof body.businessId === "string" ? body.businessId.trim() : "";
    const plan = parsePlan(body.plan);
    const cycle = parseBillingCycleQuery(
      typeof body.cycle === "string" ? body.cycle : undefined
    );

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }
    if (!plan || !isPaidPlanForConfirm(plan)) {
      return NextResponse.json(
        { error: "plan must be one of: grow, premium, elite." },
        { status: 400 }
      );
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    let email =
      (await resolveCustomerEmailForPaystack(access.userId, businessId)) ??
      access.email?.trim() ??
      null;

    if (!email || !isLikelyValidEmail(email)) {
      const envFallback = process.env.PAYSTACK_CHECKOUT_FALLBACK_EMAIL?.trim();
      if (envFallback && isLikelyValidEmail(envFallback)) {
        email = envFallback;
        console.warn(
          "[billing/paystack/initialize] No valid payer email from auth/profile/business; using PAYSTACK_CHECKOUT_FALLBACK_EMAIL."
        );
      } else {
        return NextResponse.json(
          {
            error:
              "No valid billing email found. Add an email to your account, profile, or business and try again.",
          },
          { status: 400 }
        );
      }
    }

    const charge = await resolvePaystackChargeDetails(plan, cycle);
    const listAmountMinor = charge.amountMinor;
    const listUsdMinor = Math.max(0, Math.round(charge.listUsdMajor * 100));
    if (!Number.isFinite(listAmountMinor) || listAmountMinor < 100 || listUsdMinor <= 0) {
      return NextResponse.json({ error: "Invalid charge amount." }, { status: 400 });
    }

    const currencyCode = charge.currency;
    const reference = `tellacity_${businessId.slice(0, 8)}_${Date.now()}`;

    // Compute proration + apply any available credits for mid-cycle upgrades.
    const { supabaseUrl: creditSupabaseUrl, serviceRoleKey: creditServiceRoleKey } =
      getServerEnv();
    const creditDb = createClient(creditSupabaseUrl, creditServiceRoleKey);

    const currentSub = await fetchActiveSubscriptionMeta(creditDb, businessId);
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
        await ensureProrationCredit(creditDb, {
          businessId,
          previousPlan: currentPlanKey,
          newPlan: plan,
          currentCycle: cycle,
          currentPeriodEndIso,
          amountUsdMinor: prorationUsdMinor,
        });
      }
    }

    // Cap credit usage so the final Paystack charge stays above its minimum.
    const maxApplicableUsdMinor = Math.max(0, listUsdMinor - MIN_CHARGE_USD_MINOR);
    const { rows: availableRows } = await availableCreditsUsdMinor(creditDb, businessId);
    const selection = selectCreditsForCharge(availableRows, maxApplicableUsdMinor);

    if (selection.totalAppliedUsdMinor > 0) {
      const reserved = await reserveCreditSelection(creditDb, selection, reference);
      if (!reserved.ok) {
        console.warn("[billing/paystack/initialize] reserve credits:", reserved.error);
      }
    }

    // Translate USD credit to the Paystack charge currency using the same FX
    // as the list price (keeps the ratio exact so verify can reconstruct).
    const creditRatio =
      listUsdMinor > 0 ? selection.totalAppliedUsdMinor / listUsdMinor : 0;
    const chargeCurrencyCreditMinor = Math.round(listAmountMinor * creditRatio);
    const amount = Math.max(100, listAmountMinor - chargeCurrencyCreditMinor);

    const returnToRaw = typeof body.returnTo === "string" ? body.returnTo.trim() : "";
    const returnTo =
      returnToRaw.startsWith("/business/dashboard/") && !returnToRaw.includes("..") && !returnToRaw.includes("//")
        ? returnToRaw
        : null;

    const callbackUrl = buildPaystackBillingReturnCallbackUrl(req, businessId, {
      returnPath: returnTo,
    });

    // Paystack verify reconciles charge amount using metadata.billing_cycle, always send explicit "monthly" | "annual".
    const billingCycleMetadata: "monthly" | "annual" = cycle;

    const paystackRequestBody = {
      email,
      amount,
      currency: currencyCode,
      reference,
      callback_url: callbackUrl,
      metadata: {
        business_id: businessId,
        plan_code: plan,
        billing_cycle: billingCycleMetadata,
        list_price_usd: String(charge.listUsdMajor),
        list_amount_minor: String(listAmountMinor),
        credit_applied_usd_minor: String(selection.totalAppliedUsdMinor),
        credit_applied_amount_minor: String(chargeCurrencyCreditMinor),
        previous_plan_code: currentPlanKey,
        ...(charge.fxUsdZar != null
          ? { fx_usd_zar: String(Math.round(charge.fxUsdZar * 10000) / 10000) }
          : {}),
      },
    };

    const initRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paystackRequestBody),
    });

    const initJson = (await initRes.json()) as PaystackInitResponse;
    const success =
      initRes.ok &&
      initJson.status === true &&
      Boolean(initJson.data?.access_code) &&
      Boolean(initJson.data?.authorization_url);

    if (success) {
      return NextResponse.json({
        access_code: initJson.data?.access_code,
        authorization_url: initJson.data?.authorization_url,
        reference: initJson.data?.reference ?? reference,
        currency: currencyCode,
        list_usd: charge.listUsdMajor,
        approx_settle_major: charge.settleMajor,
        fx_usd_zar: charge.fxUsdZar,
        net_amount_minor: amount,
        list_amount_minor: listAmountMinor,
        credit_applied_usd_minor: selection.totalAppliedUsdMinor,
        credit_applied_amount_minor: chargeCurrencyCreditMinor,
      });
    }

    // Paystack refused the charge, release any credits we reserved so the
    // user can retry without losing their pro-ration.
    if (selection.totalAppliedUsdMinor > 0) {
      await releasePendingCredits(creditDb, reference);
    }

    const message =
      typeof initJson.message === "string" && initJson.message.trim().length > 0
        ? initJson.message
        : "Paystack initialize failed.";
    console.error("[billing/paystack/initialize]", initRes.status, initJson);
    return NextResponse.json({ error: message }, { status: initRes.status || 502 });
  } catch (e) {
    console.error("[billing/paystack/initialize] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
