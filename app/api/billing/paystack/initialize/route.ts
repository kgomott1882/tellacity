export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm, parseBillingCycleQuery } from "@/lib/billingPlanConfirm";
import { buildPaystackBillingReturnCallbackUrl } from "@/lib/billingPaystackCallback";
import { getValidatedPaystackSecret, resolvePaystackChargeDetails } from "@/lib/billingPaystack";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

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
    const amount = charge.amountMinor;
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: "Invalid charge amount." }, { status: 400 });
    }

    const currencyCode = charge.currency;
    const reference = `tellacity_${businessId.slice(0, 8)}_${Date.now()}`;
    const callbackUrl = buildPaystackBillingReturnCallbackUrl(req, businessId);

    // Paystack verify reconciles charge amount using metadata.billing_cycle — always send explicit "monthly" | "annual".
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
      });
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
