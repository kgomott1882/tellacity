export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";
import { resendFromHeader } from "@/lib/businessDomainVerification";
import { PASSWORD_RESET_OTP_PURPOSE } from "@/lib/passwordResetOtpConstants";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    if (!email || !isValidEmailShape(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (!resendKey) {
      return NextResponse.json(
        { error: "Email delivery is not configured. Try again later." },
        { status: 503 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rpcData, error: rpcErr } = await admin.rpc("service_role_auth_email_exists", {
      p_email: email,
    });

    let accountExists = false;
    if (!rpcErr && (rpcData === true || rpcData === false)) {
      accountExists = rpcData === true;
    } else {
      const { isAuthEmailAlreadyRegistered } = await import("@/lib/signupIdentitySync");
      accountExists = await isAuthEmailAlreadyRegistered(supabaseUrl, serviceRoleKey, email);
    }

    if (!accountExists) {
      return NextResponse.json(
        {
          ok: true,
          message:
            "If an account exists for that email, a verification code has been sent.",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    await admin
      .from("email_otps")
      .update({ used: true })
      .eq("email", email)
      .eq("purpose", PASSWORD_RESET_OTP_PURPOSE)
      .eq("used", false);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insErr } = await admin.from("email_otps").insert({
      email,
      code,
      purpose: PASSWORD_RESET_OTP_PURPOSE,
      expires_at: expiresAt,
      used: false,
    });

    if (insErr) {
      console.error("[password-reset send-otp] insert:", insErr);
      return NextResponse.json({ error: "Could not create a verification code." }, { status: 500 });
    }

    const resend = new Resend(resendKey);
    const { error: mailErr } = await resend.emails.send({
      from: resendFromHeader(),
      to: [email],
      subject: "Your Tellacity password reset code",
      html: `<p>Your password reset code is:</p><p style="font-size:24px;letter-spacing:0.2em;font-weight:700">${code}</p><p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
    });

    if (mailErr) {
      console.error("[password-reset send-otp] Resend:", mailErr);
      return NextResponse.json({ error: "Could not send the email. Try again shortly." }, { status: 503 });
    }

    return NextResponse.json(
      { ok: true, message: "Verification code sent." },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[password-reset send-otp]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
