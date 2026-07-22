export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";
import { rejectIfEmailBlocked } from "@/lib/blockedEmails";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

type Body = {
  draft_id?: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

/**
 * POST /api/reviews/resend-otp
 * { draft_id } , new 6-digit code + email for an existing draft.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const draftId =
      typeof body.draft_id === "string" ? body.draft_id.trim() : "";

    if (!isUuid(draftId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: draft, error: draftErr } = await supabase
      .from("review_drafts")
      .select("id, email")
      .eq("id", draftId)
      .maybeSingle();

    if (draftErr || !draft?.email) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const toEmail = String(draft.email).trim();
    if (!toEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }

    const blocked = await rejectIfEmailBlocked(toEmail, supabase);
    if (blocked) return blocked;

    await supabase.from("review_otps").delete().eq("draft_id", draftId);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: otpErr } = await supabase.from("review_otps").insert({
      email: toEmail,
      code,
      draft_id: draftId,
      expires_at: expiresAt,
    });

    if (otpErr) {
      console.error("resend-otp insert:", otpErr);
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }

    if (!process.env.RESEND_API_KEY) {
      await supabase.from("review_otps").delete().eq("draft_id", draftId);
      return NextResponse.json(
        { error: "Email is not configured. Please try again later." },
        { status: 503 },
      );
    }

    const sendRes = await resend.emails.send({
      from: resendFromHeader(),
      to: toEmail,
      subject: "Your verification code",
      html: `<p>Your verification code is <strong>${code}</strong></p>`,
    });

    if (sendRes.error) {
      console.error("resend-otp Resend:", sendRes.error);
      await supabase.from("review_otps").delete().eq("draft_id", draftId);
      return NextResponse.json(
        { error: "Could not send verification email." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("resend-otp:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
