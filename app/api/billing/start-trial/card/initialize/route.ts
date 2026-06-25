export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildPaystackTrialCardReturnCallbackUrl } from "@/lib/billingPaystackCallback";
import { getValidatedPaystackSecret } from "@/lib/billingPaystack";
import { isPaystackCardOnTrialEnabled } from "@/lib/paystackCardOnTrial";
import {
  isLikelyValidEmail,
  resolveCustomerEmailForPaystack,
} from "@/lib/paystackCustomerEmail";
import {
  buildTrialCardCaptureReference,
  PAYSTACK_TRIAL_CARD_METADATA_PURPOSE,
  resolveTrialCardVerifyCharge,
} from "@/lib/paystackTrialCardCapture";
import { getReverseTrialEligibility } from "@/lib/provisionReverseTrial";
import { getServerEnv } from "@/lib/serverEnv";
import { isBusinessOwner } from "@/lib/businessOwnership";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

type PaystackInitResponse = {
  status?: boolean;
  message?: string;
  data?: { access_code?: string; authorization_url?: string; reference?: string };
};

/**
 * Paystack card-on-trial (Build 1): minimal verify charge to obtain reusable authorization.
 * Gated by FEATURE_PAYSTACK_CARD_ON_TRIAL.
 */
export async function POST(req: Request) {
  if (!isPaystackCardOnTrialEnabled()) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  try {
    let PAYSTACK_SECRET: string;
    try {
      PAYSTACK_SECRET = getValidatedPaystackSecret();
    } catch (error) {
      console.error("[billing/start-trial/card/initialize] config:", error);
      return NextResponse.json(
        { error: "Paystack is not configured correctly" },
        { status: 500 },
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
    if (!businessId) {
      return NextResponse.json({ error: "businessId is required." }, { status: 400 });
    }

    const access = await requireBusinessAccess(req, businessId);
    if (!access.ok) return access.response;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const isOwner = await isBusinessOwner(supabase, access.userId, businessId);
    if (!isOwner) {
      return NextResponse.json({ error: "owner_only" }, { status: 403 });
    }

    const eligibility = await getReverseTrialEligibility(businessId, supabase);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: "not_eligible", reason: eligibility.reason },
        { status: 409 },
      );
    }

    let email =
      (await resolveCustomerEmailForPaystack(access.userId, businessId)) ??
      access.email?.trim() ??
      null;

    if (!email || !isLikelyValidEmail(email)) {
      const envFallback = process.env.PAYSTACK_CHECKOUT_FALLBACK_EMAIL?.trim();
      if (envFallback && isLikelyValidEmail(envFallback)) {
        email = envFallback;
      } else {
        return NextResponse.json(
          {
            error:
              "No valid billing email found. Add an email to your account, profile, or business and try again.",
          },
          { status: 400 },
        );
      }
    }

    const { currency, amountMinor } = resolveTrialCardVerifyCharge();
    const reference = buildTrialCardCaptureReference(businessId);

    const returnToRaw = typeof body.returnTo === "string" ? body.returnTo.trim() : "";
    const returnTo =
      returnToRaw.startsWith("/business/dashboard/") &&
      !returnToRaw.includes("..") &&
      !returnToRaw.includes("//")
        ? returnToRaw
        : null;

    const callbackUrl = buildPaystackTrialCardReturnCallbackUrl(req, businessId, {
      returnPath: returnTo,
    });

    const paystackRequestBody = {
      email,
      amount: amountMinor,
      currency,
      reference,
      callback_url: callbackUrl,
      channels: ["card"],
      metadata: {
        business_id: businessId,
        purpose: PAYSTACK_TRIAL_CARD_METADATA_PURPOSE,
        verify_amount_minor: String(amountMinor),
        verify_currency: currency,
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

    if (!success) {
      const message =
        typeof initJson.message === "string" && initJson.message.trim().length > 0
          ? initJson.message
          : "Paystack initialize failed.";
      console.error("[billing/start-trial/card/initialize]", initRes.status, initJson);
      return NextResponse.json({ error: message }, { status: initRes.status || 502 });
    }

    return NextResponse.json({
      authorization_url: initJson.data?.authorization_url,
      access_code: initJson.data?.access_code,
      reference: initJson.data?.reference ?? reference,
      currency,
      verify_amount_minor: amountMinor,
    });
  } catch (e) {
    console.error("[billing/start-trial/card/initialize] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
