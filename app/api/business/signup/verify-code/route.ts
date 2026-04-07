export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BusinessSignupPendingPayload } from "@/lib/businessSignupPayload";
import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";
import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";
import { getServerEnv } from "@/lib/serverEnv";
import {
  cleanupSignupUserRows,
  formatSignupProfileErrorForClient,
  isAuthEmailAlreadyRegistered,
  syncSignupIdentityAfterAuthUserCreated,
} from "@/lib/signupIdentitySync";

type VerificationRow = {
  id: string;
  email: string;
  code: string;
  payload: BusinessSignupPendingPayload;
  expires_at: string;
  attempt_count: number | null;
  consumed_at: string | null;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeSignupError(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("already been registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already registered")
  ) {
    return "Account already exists. Please log in.";
  }
  return message;
}

function jsonError(error: string, message: string, status: number) {
  return NextResponse.json({ error, message }, { status });
}

function withDevDbDetail(
  base: string,
  err: { message?: string; code?: string } | null | undefined
): string {
  if (process.env.NODE_ENV !== "development" || !err?.message) return base;
  return `${base} [${err.code ?? "no-code"}] ${err.message}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      code?: string;
      password?: string;
    };
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !code || !password) {
      return jsonError(
        "missing_fields",
        "Email, verification code, and password are required.",
        400
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonError("invalid_email", "Please enter a valid email address", 400);
    }
    if (!/^\d{6}$/.test(code)) {
      return jsonError("invalid_code", "Enter the 6-digit verification code", 400);
    }
    if (password.length < 6) {
      return jsonError(
        "weak_password",
        "Password must be at least 6 characters.",
        400
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: verification, error: fetchError } = await supabaseAdmin
      .from("business_signup_verifications")
      .select("*")
      .eq("email", email)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError || !verification) {
      return jsonError(
        "no_pending_signup",
        "No pending verification found. Request a new code.",
        400
      );
    }

    const row = verification as VerificationRow;

    if ((row.attempt_count ?? 0) >= 5) {
      return jsonError(
        "too_many_attempts",
        "Too many attempts. Request a new code.",
        429
      );
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabaseAdmin
        .from("business_signup_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", row.id);
      return jsonError(
        "code_expired",
        "Your verification code has expired",
        400
      );
    }

    if (row.code !== code) {
      const next = (row.attempt_count ?? 0) + 1;

      await supabaseAdmin
        .from("business_signup_verifications")
        .update({
          attempt_count: next,
        })
        .eq("id", row.id);

      if (next >= 5) {
        return jsonError(
          "too_many_attempts",
          "Too many attempts. Request a new code.",
          429
        );
      }

      return jsonError("wrong_code", "Invalid verification code", 400);
    }

    const payload = row.payload;
    if (!payload || typeof payload !== "object") {
      return jsonError(
        "invalid_payload",
        "Verification data is invalid. Start signup again.",
        400
      );
    }

    const websiteDomain = normalizeBusinessDomain(payload.website ?? "");
    const emailDomain = normalizeBusinessDomain(email.split("@")[1] || "");

    if (websiteDomain !== emailDomain) {
      return jsonError(
        "domain_mismatch",
        "Use your business email address to verify ownership",
        400
      );
    }

    const phoneTrim =
      typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : "";

    const emailTaken = await isAuthEmailAlreadyRegistered(supabaseUrl, serviceRoleKey, email);
    if (emailTaken) {
      return jsonError(
        "account_exists",
        "Account already exists. Please log in.",
        409
      );
    }

    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();

    const countryCode = String(payload.country ?? "")
      .trim()
      .toUpperCase()
      .slice(0, 2);

    const { data: userRes, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "business",
        display_name: fullName,
        signup_first_name: payload.firstName.trim(),
        signup_last_name: payload.lastName.trim(),
        signup_website: normalizeWebsiteDomain(payload.website ?? ""),
        signup_company_name: payload.companyName.trim(),
        signup_job_title:
          typeof payload.jobTitle === "string" ? payload.jobTitle.trim() : "",
        signup_country_code: countryCode,
        country: countryCode,
      },
    });

    if (userError || !userRes?.user?.id) {
      const msg = userError?.message ?? "Failed to create user";
      return jsonError(
        "create_user_failed",
        normalizeSignupError(msg),
        userError?.message?.toLowerCase().includes("already") ? 400 : 500
      );
    }

    const userId = userRes.user.id;

    const synced = await syncSignupIdentityAfterAuthUserCreated(supabaseAdmin, {
      userId,
      emailNorm: email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: phoneTrim || undefined,
    });

    if (!synced.ok) {
      await cleanupSignupUserRows(supabaseAdmin, userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      console.error("business signup verify profile:", synced.error);
      return jsonError(
        "profile_failed",
        withDevDbDetail(formatSignupProfileErrorForClient(synced.error), synced.error),
        500
      );
    }

    const companyName = payload.companyName.trim();
    if (companyName) {
      const { error: bpErr } = await supabaseAdmin.from("business_profiles").upsert(
        {
          id: userId,
          email,
          business_name: companyName,
        },
        { onConflict: "id" }
      );
      if (bpErr && process.env.NODE_ENV === "development") {
        console.warn("business signup business_profiles:", bpErr.message);
      }
    }

    await supabaseAdmin
      .from("business_signup_verifications")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("consumed_at", null);

    return NextResponse.json({
      success: true,
      outcome: "account_created" as const,
    });
  } catch (err) {
    console.error("VERIFY CODE ERROR:", err);
    return jsonError(
      "unexpected_error",
      "Something went wrong. Please try again.",
      500
    );
  }
}
