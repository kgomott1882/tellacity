export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { getAuthUserIdByEmail } from "@/lib/authAdminUsers";
import { PASSWORD_RESET_OTP_PURPOSE } from "@/lib/passwordResetOtpConstants";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const MIN_PASSWORD = 8;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      code?: string;
      newPassword?: string;
    };
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const codeRaw = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!email || !isValidEmailShape(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (codeRaw.length !== 6) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }
    if (newPassword.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD} characters.` },
        { status: 400 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rows, error: selErr } = await admin
      .from("email_otps")
      .select("id, expires_at, used")
      .eq("email", email)
      .eq("purpose", PASSWORD_RESET_OTP_PURPOSE)
      .eq("code", codeRaw)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (selErr) {
      console.error("[password-reset complete] select:", selErr);
      return NextResponse.json({ error: "Verification failed. Try again." }, { status: 500 });
    }

    const row = rows?.[0] as { id: string; expires_at: string; used: boolean } | undefined;
    if (!row) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await admin.from("email_otps").update({ used: true }).eq("id", row.id);
      return NextResponse.json({ error: "This code has expired. Request a new one." }, { status: 400 });
    }

    const userId = await getAuthUserIdByEmail(supabaseUrl, serviceRoleKey, email);
    if (!userId) {
      return NextResponse.json({ error: "No account found for that email." }, { status: 400 });
    }

    const { error: updAuthErr } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (updAuthErr) {
      console.error("[password-reset complete] updateUser:", updAuthErr);
      return NextResponse.json(
        { error: updAuthErr.message || "Could not update password." },
        { status: 400 }
      );
    }

    await admin.from("email_otps").update({ used: true }).eq("id", row.id);
    await admin
      .from("email_otps")
      .update({ used: true })
      .eq("email", email)
      .eq("purpose", PASSWORD_RESET_OTP_PURPOSE)
      .eq("used", false);

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[password-reset complete]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
