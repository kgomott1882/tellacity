export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { sendBusinessDomainVerificationOtp } from "@/lib/sendBusinessDomainVerificationOtp";
import {
  httpStatusForVerifyDomainOutcome,
  isVerifyDomainRpcMissing,
  verifyDomainFinishWithServiceRole,
} from "@/lib/verifyDomainFinishServer";
import { provisionReverseTrialIfEligible } from "@/lib/provisionReverseTrial";

type RpcResult = {
  ok?: boolean;
  error?: string;
  already_owner?: boolean;
};

function statusForRpcError(err: string | undefined): number {
  switch (err) {
    case "not_authenticated":
      return 401;
    case "business_not_found":
      return 404;
    case "domain_mismatch":
      return 403;
    case "already_claimed":
      return 409;
    case "invalid_code":
    case "no_pending_code":
    case "code_expired":
    case "wrong_code":
    case "invalid_email":
    case "unsupported_business_status":
      return 400;
    case "business_update_failed":
      return 500;
    default:
      return 400;
  }
}

function messageForVerifyError(err: string): string | undefined {
  switch (err) {
    case "domain_mismatch":
      return "Your email domain must match this business website.";
    case "already_claimed":
      return "This business already has an owner.";
    case "no_pending_code":
      return "Request a new code first.";
    case "code_expired":
      return "This code has expired.";
    case "wrong_code":
      return "That code is incorrect.";
    case "unsupported_business_status":
      return "This listing cannot be verified in its current state.";
    case "business_update_failed":
      return "Could not update the business. Try again or contact support.";
    default:
      return undefined;
  }
}

function nextResponseForRpcResult(result: RpcResult | null): NextResponse {
  if (!result?.ok) {
    const err = result?.error ?? "unknown";
    const status = statusForRpcError(err);
    const message = messageForVerifyError(err);
    return NextResponse.json(
      {
        error: err,
        ...(message ? { message } : {}),
      },
      { status }
    );
  }
  if (result.already_owner) {
    return NextResponse.json({ ok: true, alreadyOwner: true });
  }
  return NextResponse.json({ ok: true });
}

async function finishVerifyDomainRpcSuccess(
  admin: SupabaseClient,
  businessId: string,
  result: RpcResult,
): Promise<NextResponse> {
  if (!result?.ok) {
    return nextResponseForRpcResult(result);
  }
  if (!result.already_owner) {
    await provisionReverseTrialIfEligible(businessId, admin);
  }
  return nextResponseForRpcResult(result);
}

/**
 * Domain OTP for post-login onboarding.
 * - Without `code`: insert pending verification row and email a 6-digit code to the session email.
 * - With `code`: prefer SECURITY DEFINER RPC via service_role (no direct UPDATE), then JWT RPC, then TS fallback.
 */
export async function POST(req: Request) {
  try {
    const supabaseUser = await createSupabaseServerCookies();
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user?.id || !user.email) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      businessId?: string;
      code?: string;
    };
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const codeRaw = typeof body.code === "string" ? body.code.trim() : "";

    if (!businessId) {
      return NextResponse.json({ error: "missing_business_id" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (!codeRaw) {
      const otpResult = await sendBusinessDomainVerificationOtp(
        admin,
        supabaseUser,
        businessId
      );
      if (!otpResult.ok) {
        const payload: Record<string, unknown> = {
          error: otpResult.error,
          ...(otpResult.message ? { message: otpResult.message } : {}),
          ...(otpResult.dev ?? {}),
        };
        return NextResponse.json(payload, { status: otpResult.status });
      }
      if (otpResult.sent === false && otpResult.alreadyOwner) {
        return NextResponse.json({ ok: true, sent: false, alreadyOwner: true });
      }
      return NextResponse.json({ ok: true, sent: true });
    }

    // 1) Server-only RPC (service_role): avoids permission denied on public.users from direct UPDATE + triggers.
    const serviceRpc = await admin.rpc("verify_domain_finish_business_claim_service", {
      p_business_id: businessId,
      p_user_id: user.id,
      p_code: codeRaw,
    });

    if (!serviceRpc.error && serviceRpc.data != null) {
      const data = serviceRpc.data as RpcResult;
      return finishVerifyDomainRpcSuccess(admin, businessId, data);
    }

    if (serviceRpc.error && !isVerifyDomainRpcMissing(serviceRpc.error)) {
      console.error("verify-domain service rpc:", serviceRpc.error);
      return NextResponse.json(
        {
          error: "rpc_failed",
          message: serviceRpc.error.message,
          ...(process.env.NODE_ENV === "development"
            ? { db_code: serviceRpc.error.code, db_message: serviceRpc.error.message }
            : {}),
        },
        { status: 500 }
      );
    }

    // 2) Authenticated RPC (user JWT)
    const {
      data: { session },
    } = await supabaseUser.auth.getSession();
    const accessToken = session?.access_token;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (accessToken && anonKey) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const jwtRpc = await userClient.rpc("verify_domain_finish_business_claim", {
        p_business_id: businessId,
        p_code: codeRaw,
      });

      if (!jwtRpc.error && jwtRpc.data != null) {
        const data = jwtRpc.data as RpcResult;
        return finishVerifyDomainRpcSuccess(admin, businessId, data);
      }

      if (jwtRpc.error && !isVerifyDomainRpcMissing(jwtRpc.error)) {
        console.error("verify-domain jwt rpc:", jwtRpc.error);
        return NextResponse.json(
          {
            error: "rpc_failed",
            message: jwtRpc.error.message,
            ...(process.env.NODE_ENV === "development"
              ? { db_code: jwtRpc.error.code, db_message: jwtRpc.error.message }
              : {}),
          },
          { status: 500 }
        );
      }
    }

    // 3) Last resort: direct PostgREST (may hit permission denied for table users on some DBs).
    console.warn(
      "verify-domain: RPCs missing; using direct update fallback. Apply migrations 20260608120000 and 20260608140000."
    );
    const fallback = await verifyDomainFinishWithServiceRole(admin, {
      businessId,
      code: codeRaw,
      userId: user.id,
      sessionEmail: user.email,
    });
    if (!fallback.ok) {
      const status = httpStatusForVerifyDomainOutcome(fallback);
      const err = fallback.error;
      const message =
        messageForVerifyError(err) ??
        (err === "owner_link_failed" ? fallback.message : undefined);
      return NextResponse.json(
        {
          error: err,
          ...(message ? { message } : {}),
          ...(fallback.dev ?? {}),
        },
        { status }
      );
    }
    if (fallback.already_owner) {
      return NextResponse.json({ ok: true, alreadyOwner: true });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-domain:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
