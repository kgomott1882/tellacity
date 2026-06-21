import type { SupabaseClient } from "@supabase/supabase-js";
import { sessionEmailDomainMatchesBusinessWebsite } from "@/lib/businessDomainVerification";
import { ensureBusinessOwnershipRow } from "@/lib/businessSignupVerifyHelpers";
import { provisionReverseTrialIfEligible } from "@/lib/provisionReverseTrial";

/** PostgREST: RPC not in schema cache / not created yet. */
export function isVerifyDomainRpcMissing(err: { message?: string; code?: string }): boolean {
  const m = err.message ?? "";
  return (
    err.code === "PGRST202" ||
    err.code === "42883" ||
    m.includes("Could not find the function") ||
    m.includes("schema cache")
  );
}

/** Outcome aligned with RPC `verify_domain_finish_business_claim` jsonb shape. */
export type VerifyDomainFinishOutcome =
  | { ok: true; already_owner?: boolean }
  | { ok: false; error: string; message?: string; dev?: Record<string, unknown> };

function statusForError(err: string): number {
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
    case "unsupported_business_status":
      return 400;
    case "business_update_failed":
    case "owner_link_failed":
      return 500;
    default:
      return 400;
  }
}

export function httpStatusForVerifyDomainOutcome(outcome: VerifyDomainFinishOutcome): number {
  if (outcome.ok) return 200;
  return statusForError(outcome.error);
}

/**
 * Same logic as `verify_domain_finish_business_claim` but via service role (PostgREST).
 * Used when the RPC is not deployed yet. May hit DB permission errors if triggers reference restricted tables.
 */
export async function verifyDomainFinishWithServiceRole(
  admin: SupabaseClient,
  input: {
    businessId: string;
    code: string;
    userId: string;
    sessionEmail: string;
  }
): Promise<VerifyDomainFinishOutcome> {
  const { businessId, code: codeRaw, userId, sessionEmail } = input;
  const sessionEmailNorm = sessionEmail.trim().toLowerCase();

  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, website, owner_id, is_claimed, status")
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr || !biz) {
    return { ok: false, error: "business_not_found" };
  }

  if (!sessionEmailDomainMatchesBusinessWebsite(sessionEmailNorm, biz.website)) {
    return {
      ok: false,
      error: "domain_mismatch",
      message: "Your email domain must match this business website.",
    };
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
    return {
      ok: false,
      error: "already_claimed",
      message: "This business already has an owner.",
    };
  }

  if (!/^\d{6}$/.test(codeRaw)) {
    return { ok: false, error: "invalid_code" };
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
    return {
      ok: false,
      error: "no_pending_code",
      message: "Request a new code first.",
    };
  }

  if (new Date(vRow.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "code_expired", message: "This code has expired." };
  }

  if (vRow.code !== codeRaw) {
    return { ok: false, error: "wrong_code", message: "That code is incorrect." };
  }

  if (existingBo?.owner_user_id === userId) {
    await admin
      .from("business_domain_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", vRow.id);
    return { ok: true, already_owner: true };
  }

  if (!isDraft && !isActiveListing) {
    return {
      ok: false,
      error: "unsupported_business_status",
      message: "This listing cannot be verified in its current state.",
    };
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
      return {
        ok: false,
        error: "business_update_failed",
        message: upBiz.message,
        ...(process.env.NODE_ENV === "development"
          ? { dev: { db_code: upBiz.code, db_message: upBiz.message } }
          : {}),
      };
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
      return {
        ok: false,
        error: "business_update_failed",
        message: upBiz.message,
        ...(process.env.NODE_ENV === "development"
          ? { dev: { db_code: upBiz.code, db_message: upBiz.message } }
          : {}),
      };
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
    return {
      ok: false,
      error: "owner_link_failed",
      message: ownership.error.message,
      ...(process.env.NODE_ENV === "development"
        ? {
            dev: {
              db_error: {
                code: ownership.error.code,
                message: ownership.error.message,
                details: ownership.error.details,
                hint: ownership.error.hint,
                phase: ownership.error.phase,
              },
            },
          }
        : {}),
    };
  }

  await admin
    .from("business_domain_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", vRow.id);

  await provisionReverseTrialIfEligible(businessId, admin);

  return { ok: true };
}

type ServiceRpcResult = {
  ok?: boolean;
  error?: string;
  already_owner?: boolean;
};

/**
 * Uses the signup OTP (same code emailed during `/business/signup`) to finalize domain claim
 * via the same path as `POST /api/business/verify-domain` with a code.
 */
export async function finalizeSignupDomainClaim(
  admin: SupabaseClient,
  input: {
    businessId: string;
    userId: string;
    sessionEmail: string;
    code: string;
    expiresAt: string;
  }
): Promise<VerifyDomainFinishOutcome> {
  const { businessId, userId, sessionEmail, code, expiresAt } = input;
  const sessionEmailNorm = sessionEmail.trim().toLowerCase();

  await admin
    .from("business_domain_verifications")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .is("consumed_at", null);

  const { error: insErr } = await admin.from("business_domain_verifications").insert({
    user_id: userId,
    business_id: businessId,
    email: sessionEmailNorm,
    code,
    expires_at: expiresAt,
    consumed_at: null,
  });

  if (insErr) {
    console.error("finalizeSignupDomainClaim insert:", insErr);
    return {
      ok: false,
      error: "otp_persist_failed",
      message: insErr.message,
    };
  }

  const serviceRpc = await admin.rpc("verify_domain_finish_business_claim_service", {
    p_business_id: businessId,
    p_user_id: userId,
    p_code: code,
  });

  if (!serviceRpc.error && serviceRpc.data != null) {
    const data = serviceRpc.data as ServiceRpcResult;
    if (data?.ok) {
      if (!data.already_owner) {
        await provisionReverseTrialIfEligible(businessId, admin);
      }
      return { ok: true, already_owner: data.already_owner };
    }
    return {
      ok: false,
      error: data?.error ?? "unknown",
      message: messageForSignupClaimError(data?.error),
    };
  }

  if (serviceRpc.error && !isVerifyDomainRpcMissing(serviceRpc.error)) {
    console.error("finalizeSignupDomainClaim service rpc:", serviceRpc.error);
  }

  return verifyDomainFinishWithServiceRole(admin, {
    businessId,
    code,
    userId,
    sessionEmail: sessionEmailNorm,
  });
}

function messageForSignupClaimError(err: string | undefined): string | undefined {
  switch (err) {
    case "domain_mismatch":
      return "Your email domain must match this business website.";
    case "already_claimed":
      return "This business has already been claimed.";
    case "wrong_code":
      return "Invalid verification code.";
    case "code_expired":
      return "Your verification code has expired.";
    default:
      return undefined;
  }
}
