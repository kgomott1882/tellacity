import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  resendFromHeader,
  sessionEmailDomainMatchesBusinessWebsite,
} from "@/lib/businessDomainVerification";

export type SendBusinessDomainVerificationOtpResult =
  | { ok: true; sent: true }
  | { ok: true; sent: false; alreadyOwner: true }
  | {
      ok: false;
      status: number;
      error: string;
      message?: string;
      dev?: Record<string, unknown>;
    };

/**
 * Load business, validate eligibility, persist OTP row, email 6-digit code.
 * Uses `sessionSupabase.auth.getUser()` for user id + email (never trust client body for email).
 * Shared by POST /api/business/verify-domain (resend) and create-draft (immediate send).
 */
export async function sendBusinessDomainVerificationOtp(
  admin: SupabaseClient,
  sessionSupabase: SupabaseClient,
  businessId: string
): Promise<SendBusinessDomainVerificationOtpResult> {
  const {
    data: { user },
    error: authErr,
  } = await sessionSupabase.auth.getUser();

  if (authErr || !user?.id) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "You must be signed in.",
    };
  }

  const userId = user.id;
  const sessionEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
  if (!sessionEmail) {
    return {
      ok: false,
      status: 401,
      error: "missing_user_email",
      message: "Missing user email for OTP.",
    };
  }

  const { data: biz, error: bizErr } = await admin
    .from("businesses")
    .select("id, website, owner_id, is_claimed, status")
    .eq("id", businessId)
    .maybeSingle();

  if (bizErr || !biz) {
    return { ok: false, status: 404, error: "business_not_found" };
  }

  if (!sessionEmailDomainMatchesBusinessWebsite(sessionEmail, biz.website)) {
    return {
      ok: false,
      status: 403,
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
      status: 409,
      error: "already_claimed",
      message: "This business already has an owner.",
    };
  }

  if (!isDraft && !isActiveListing) {
    return {
      ok: false,
      status: 400,
      error: "not_eligible",
      message: "This business cannot be verified from the dashboard.",
    };
  }
  if (isDraft && biz.owner_id != null && String(biz.owner_id).trim() !== "") {
    return {
      ok: false,
      status: 400,
      error: "not_eligible",
      message: "Draft business is already assigned.",
    };
  }
  if (isActiveListing) {
    if (biz.owner_id != null && String(biz.owner_id).trim() !== "") {
      return {
        ok: false,
        status: 409,
        error: "already_claimed",
        message: "This business already has an owner.",
      };
    }
    if (biz.is_claimed === true) {
      return {
        ok: false,
        status: 409,
        error: "already_claimed",
        message: "This business is already claimed.",
      };
    }
  }

  if (existingBo?.owner_user_id === userId) {
    return { ok: true, sent: false, alreadyOwner: true };
  }

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, status: 503, error: "email_unavailable" };
  }

  const { error: delPendingErr } = await admin
    .from("business_domain_verifications")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .is("consumed_at", null);

  if (delPendingErr) {
    console.error("sendBusinessDomainVerificationOtp delete pending OTPs:", delPendingErr);
    return {
      ok: false,
      status: 500,
      error: "otp_clear_failed",
      message: delPendingErr.message,
      ...(process.env.NODE_ENV === "development"
        ? {
            dev: {
              db_code: delPendingErr.code,
              db_message: delPendingErr.message,
            },
          }
        : {}),
    };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insVErr } = await admin.from("business_domain_verifications").insert({
    user_id: userId,
    business_id: businessId,
    email: sessionEmail,
    code: otp,
    expires_at: expiresAt,
    consumed_at: null,
  });

  if (insVErr) {
    console.error("sendBusinessDomainVerificationOtp insert:", insVErr);
    return {
      ok: false,
      status: 500,
      error: "otp_persist_failed",
      message: insVErr.message,
      ...(process.env.NODE_ENV === "development"
        ? {
            dev: {
              db_code: insVErr.code,
              db_message: insVErr.message,
            },
          }
        : {}),
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: resendFromHeader(),
      to: sessionEmail,
      subject: "Your Tellacity domain verification code",
      html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif">
<p>Your verification code is: <strong style="letter-spacing:4px;font-size:1.25rem">${otp}</strong></p>
<p>This code expires in 15 minutes.</p>
</body></html>`,
    });
  } catch (mailErr) {
    console.error("sendBusinessDomainVerificationOtp Resend:", mailErr);
    await admin
      .from("business_domain_verifications")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", userId)
      .is("consumed_at", null);
    return { ok: false, status: 500, error: "email_failed" };
  }

  return { ok: true, sent: true };
}
