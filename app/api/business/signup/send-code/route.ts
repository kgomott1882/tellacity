export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import type { BusinessSignupPendingPayload } from "@/lib/businessSignupPayload";
import { BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE } from "@/lib/businessSignupDomainMessage";
import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";
import { getServerEnv } from "@/lib/serverEnv";
import { isAuthEmailAlreadyRegistered } from "@/lib/signupIdentitySync";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

function isWebsiteFilled(raw: string): boolean {
  const t = raw.trim();
  if (!t) return false;
  return t.replace(/^https?:\/\//i, "").trim().length > 0;
}

function isUuid(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<BusinessSignupPendingPayload> & {
      email?: string;
    };

    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const website = typeof body.website === "string" ? body.website.trim() : "";
    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : "";
    const firstName =
      typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const jobTitle = typeof body.jobTitle === "string" ? body.jobTitle.trim() : "";
    const country = typeof body.country === "string" ? body.country.trim() : "";
    const phoneNumber =
      typeof body.phoneNumber === "string" && body.phoneNumber.trim()
        ? body.phoneNumber.trim()
        : undefined;
    const plan = typeof body.plan === "string" ? body.plan.trim() : undefined;

    let selectedBusinessId: string | null = null;
    if (body.selectedBusinessId != null && body.selectedBusinessId !== "") {
      if (!isUuid(String(body.selectedBusinessId))) {
        return NextResponse.json({ error: "invalid_business" }, { status: 400 });
      }
      selectedBusinessId = String(body.selectedBusinessId);
    }

    if (
      !isWebsiteFilled(website) ||
      !companyName ||
      !firstName ||
      !lastName ||
      !country
    ) {
      return NextResponse.json({ error: "incomplete_form" }, { status: 400 });
    }

    const websiteDomain = normalizeBusinessDomain(website);
    const emailDomain = normalizeBusinessDomain(email.split("@")[1] || "");
    if (!emailDomain || websiteDomain !== emailDomain) {
      return NextResponse.json(
        { error: "domain_mismatch", message: BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "email_unavailable" }, { status: 503 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const alreadyAuth = await isAuthEmailAlreadyRegistered(supabaseUrl, serviceRoleKey, email);
    if (alreadyAuth) {
      return NextResponse.json(
        {
          error: "account_exists",
          message: "Account already exists. Please log in.",
        },
        { status: 409 }
      );
    }

    const payload: BusinessSignupPendingPayload = {
      selectedBusinessId,
      website,
      companyName,
      firstName,
      lastName,
      jobTitle,
      country,
      ...(phoneNumber ? { phoneNumber } : {}),
      ...(plan ? { plan } : {}),
    };

    await supabase
      .from("business_signup_verifications")
      .delete()
      .eq("email", email);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data: row, error: insErr } = await supabase
      .from("business_signup_verifications")
      .insert({
        email,
        code,
        payload,
        expires_at: expiresAt,
        attempt_count: 0,
        consumed_at: null,
      })
      .select("id")
      .single();

    if (insErr || !row?.id) {
      console.error("business signup send-code insert:", insErr);
      return NextResponse.json({ error: "otp_failed" }, { status: 500 });
    }

    const subject = "Your Tellacity verification code";
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111827;">
  <p>Your verification code is: <strong style="letter-spacing:4px;font-size:1.25rem">${code}</strong></p>
  <p>This code expires in 15 minutes.</p>
</body>
</html>
`.trim();

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: resendFromHeader(),
        to: email,
        subject,
        html,
      });
    } catch (mailErr) {
      console.error("business signup send-code Resend:", mailErr);
      await supabase.from("business_signup_verifications").delete().eq("id", row.id);
      return NextResponse.json({ error: "email_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("business signup send-code:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
