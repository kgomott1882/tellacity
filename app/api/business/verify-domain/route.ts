export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { sessionEmailDomainMatchesBusinessWebsite } from "@/lib/businessDomainVerification";
import { ensureBusinessOwnershipRow } from "@/lib/businessSignupVerifyHelpers";
import { sendBusinessDomainVerificationOtp } from "@/lib/sendBusinessDomainVerificationOtp";

/**
 * Domain OTP for post-login onboarding.
 * - Without `code`: insert pending verification row and email a 6-digit code to the session email.
 * - With `code`: validate, activate/claim `businesses` first, then INSERT business_owners ON CONFLICT DO NOTHING.
 * Email vs website uses normalizeWebsiteDomain (sessionEmailDomainMatchesBusinessWebsite, sendBusinessDomainVerificationOtp).
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

    const userId = user.id;
    const sessionEmail = user.email.trim().toLowerCase();

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

    const { data: biz, error: bizErr } = await admin
      .from("businesses")
      .select("id, website, owner_id, is_claimed, status")
      .eq("id", businessId)
      .maybeSingle();

    if (bizErr || !biz) {
      return NextResponse.json({ error: "business_not_found" }, { status: 404 });
    }

    if (!sessionEmailDomainMatchesBusinessWebsite(sessionEmail, biz.website)) {
      return NextResponse.json(
        { error: "domain_mismatch", message: "Your email domain must match this business website." },
        { status: 403 }
      );
    }

    const statusLower = String(biz.status ?? "").toLowerCase();
    const isDraft = statusLower === "pending_verification";
    const isActiveListing =
      statusLower === "active" || statusLower === "" || biz.status == null;

    const { data: existingBo } = await admin
      .from("business_owners")
      .select("owner_user_id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (existingBo?.owner_user_id && existingBo.owner_user_id !== userId) {
      return NextResponse.json(
        { error: "already_claimed", message: "This business already has an owner." },
        { status: 409 }
      );
    }

    if (!/^\d{6}$/.test(codeRaw)) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    const { data: vRow, error: vFetchErr } = await admin
      .from("business_domain_verifications")
      .select("id, code, expires_at, consumed_at")
      .eq("user_id", userId)
      .eq("business_id", businessId)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (vFetchErr || !vRow) {
      return NextResponse.json(
        { error: "no_pending_code", message: "Request a new code first." },
        { status: 400 }
      );
    }

    if (new Date(vRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "code_expired" }, { status: 400 });
    }

    if (vRow.code !== codeRaw) {
      return NextResponse.json({ error: "wrong_code" }, { status: 400 });
    }

    if (existingBo?.owner_user_id === userId) {
      await admin
        .from("business_domain_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", vRow.id);
      return NextResponse.json({ ok: true, alreadyOwner: true });
    }

    if (isDraft) {
      const { error: upBiz } = await admin
        .from("businesses")
        .update({
          owner_id: userId,
          is_claimed: true,
          status: "active",
          submission_status: "approved",
        })
        .eq("id", businessId)
        .eq("status", "pending_verification");

      if (upBiz) {
        console.error("verify-domain activate draft business:", upBiz);
        return NextResponse.json(
          {
            error: "business_update_failed",
            message: upBiz.message,
            ...(process.env.NODE_ENV === "development"
              ? { db_code: upBiz.code, db_message: upBiz.message }
              : {}),
          },
          { status: 500 }
        );
      }
    } else if (isActiveListing) {
      const { error: upBiz } = await admin
        .from("businesses")
        .update({
          owner_id: userId,
          is_claimed: true,
        })
        .eq("id", businessId)
        .is("owner_id", null);

      if (upBiz) {
        console.error("verify-domain claim listing:", upBiz);
        return NextResponse.json(
          {
            error: "business_update_failed",
            message: upBiz.message,
            ...(process.env.NODE_ENV === "development"
              ? { db_code: upBiz.code, db_message: upBiz.message }
              : {}),
          },
          { status: 500 }
        );
      }
    }

    const ownership = await ensureBusinessOwnershipRow(admin, businessId, userId, {
      supabaseClientRole: "service_role",
    });

    if (!ownership.ok) {
      console.error("verify-domain ensureBusinessOwnershipRow failed", {
        businessId,
        userId,
        error: ownership.error,
      });
      return NextResponse.json(
        {
          error: "owner_link_failed",
          message: ownership.error.message,
          ...(process.env.NODE_ENV === "development"
            ? {
                db_error: {
                  code: ownership.error.code,
                  message: ownership.error.message,
                  details: ownership.error.details,
                  hint: ownership.error.hint,
                  phase: ownership.error.phase,
                },
              }
            : {}),
        },
        { status: 500 }
      );
    }

    await admin
      .from("business_domain_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", vRow.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-domain:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
