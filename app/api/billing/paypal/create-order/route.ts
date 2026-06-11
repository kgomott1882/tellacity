export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";
import { isPaidPlanForConfirm, parseBillingCycleQuery } from "@/lib/billingPlanConfirm";
import {
  buildPaypalBillingCancelUrl,
  buildPaypalBillingReturnUrl,
} from "@/lib/billingPaypalCallback";
import {
  encodePaypalCustomId,
  getPaypalAccessToken,
  getPaypalApiBase,
  getValidatedPaypalCredentials,
  usdMinorToPaypalValue,
} from "@/lib/billingPaypal";
import { prepareUsdCheckoutCharge } from "@/lib/billingUsdCheckoutCharge";
import { releasePendingCredits, reserveCreditSelection } from "@/lib/billingCredits";
import { getServerEnv } from "@/lib/serverEnv";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

function parsePlan(raw: unknown): PaidPlanKey | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim().toLowerCase();
  if (p === "grow" || p === "premium" || p === "elite") return p;
  return null;
}

function isLikelyValidEmail(raw: string): boolean {
  const s = raw.trim();
  return s.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function resolveCustomerEmail(userId: string, businessId: string): Promise<string | null> {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(userId);
  if (!authErr) {
    const authEmail = authData?.user?.email?.trim();
    if (authEmail && isLikelyValidEmail(authEmail)) return authEmail;
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
  if (profileEmail && isLikelyValidEmail(profileEmail)) return profileEmail;

  const { data: business } = await supabase
    .from("businesses")
    .select("email")
    .eq("id", businessId)
    .maybeSingle();
  const bizEmail =
    business && typeof (business as { email?: unknown }).email === "string"
      ? (business as { email: string }).email.trim()
      : "";
  if (bizEmail && isLikelyValidEmail(bizEmail)) return bizEmail;

  return null;
}

type PayPalCreateOrderResponse = {
  id?: string;
  status?: string;
  links?: { href?: string; rel?: string; method?: string }[];
};

export async function POST(req: Request) {
  try {
    getValidatedPaypalCredentials();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "PayPal is not configured correctly";
    console.error("[billing/paypal/create-order] config:", message);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const plan = parsePlan(body.plan);
    const cycle = parseBillingCycleQuery(typeof body.cycle === "string" ? body.cycle : undefined);

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

    const email =
      (await resolveCustomerEmail(access.userId, businessId)) ?? access.email?.trim() ?? null;
    if (!email || !isLikelyValidEmail(email)) {
      return NextResponse.json(
        { error: "No valid billing email found on your account." },
        { status: 400 }
      );
    }

    const returnToRaw = typeof body.returnTo === "string" ? body.returnTo.trim() : "";
    const returnTo =
      returnToRaw.startsWith("/business/dashboard/") &&
      !returnToRaw.includes("..") &&
      !returnToRaw.includes("//")
        ? returnToRaw
        : null;

    const creditReference = `tellacity_paypal_${businessId.slice(0, 8)}_${Date.now()}`;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const db = createClient(supabaseUrl, serviceRoleKey);

    const charge = await prepareUsdCheckoutCharge(db, businessId, plan, cycle, creditReference);

    if (charge.selection.totalAppliedUsdMinor > 0) {
      const reserved = await reserveCreditSelection(db, charge.selection, creditReference);
      if (!reserved.ok) {
        console.warn("[billing/paypal/create-order] reserve credits:", reserved.error);
      }
    }

    const customId = encodePaypalCustomId({
      businessId,
      plan,
      cycle,
      creditReference,
      creditAppliedUsdMinor: charge.credit_applied_usd_minor,
      listUsdMinor: charge.list_amount_minor,
    });

    const token = await getPaypalAccessToken();
    const orderBody = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: businessId,
          custom_id: customId,
          invoice_id: creditReference,
          description: `Tellacity ${plan} plan (${cycle})`,
          amount: {
            currency_code: "USD",
            value: usdMinorToPaypalValue(charge.net_amount_minor),
          },
        },
      ],
      application_context: {
        brand_name: "Tellacity",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: buildPaypalBillingReturnUrl(req, businessId, { returnPath: returnTo }),
        cancel_url: buildPaypalBillingCancelUrl(req, plan, cycle, returnTo),
      },
    };

    const orderRes = await fetch(`${getPaypalApiBase()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderBody),
    });

    const orderJson = (await orderRes.json().catch(() => ({}))) as PayPalCreateOrderResponse & {
      message?: string;
      details?: { issue?: string; description?: string }[];
    };

    if (!orderRes.ok || !orderJson.id) {
      if (charge.selection.totalAppliedUsdMinor > 0) {
        await releasePendingCredits(db, creditReference);
      }
      const detail = orderJson.details?.[0];
      const message =
        detail?.description ||
        orderJson.message ||
        "PayPal could not create the order.";
      console.error("[billing/paypal/create-order]", orderRes.status, orderJson);
      return NextResponse.json({ error: message }, { status: orderRes.status || 502 });
    }

    const approvalUrl = orderJson.links?.find((l) => l.rel === "approve")?.href?.trim() ?? "";
    if (!approvalUrl) {
      if (charge.selection.totalAppliedUsdMinor > 0) {
        await releasePendingCredits(db, creditReference);
      }
      return NextResponse.json({ error: "PayPal did not return an approval URL." }, { status: 502 });
    }

    return NextResponse.json({
      orderId: orderJson.id,
      approvalUrl,
      currency: "USD",
      net_amount_minor: charge.net_amount_minor,
      list_amount_minor: charge.list_amount_minor,
      credit_applied_usd_minor: charge.credit_applied_usd_minor,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error.";
    console.error("[billing/paypal/create-order] unhandled:", message);
    const status = /paypal|credentials|auth failed/i.test(message) ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
