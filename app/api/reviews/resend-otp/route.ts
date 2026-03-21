export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";

type Body = {
  reviewId?: string;
  email?: string;
};

function isValidUuid(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const reviewId =
      typeof body.reviewId === "string" ? body.reviewId.trim() : "";
    const email = normalizeEmail(
      typeof body.email === "string" ? body.email : "",
    );

    if (!isValidUuid(reviewId)) {
      return NextResponse.json({ error: "invalid_review" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "email_unavailable" }, { status: 503 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: review, error: reviewErr } = await supabase
      .from("reviews")
      .select("id, guest_email, guest_name, status, draft")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewErr) {
      console.error("resend-otp review fetch:", reviewErr);
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }

    if (!review) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (review.status === "published") {
      return NextResponse.json({ error: "not_draft" }, { status: 400 });
    }

    const isDraft = review.draft === true || review.status === "draft";
    if (!isDraft) {
      return NextResponse.json({ error: "not_draft" }, { status: 400 });
    }

    if (normalizeEmail(String(review.guest_email ?? "")) !== email) {
      return NextResponse.json({ error: "email_mismatch" }, { status: 400 });
    }

    const guestName = String(review.guest_name ?? "there").trim() || "there";

    await supabase
      .from("review_email_otps")
      .delete()
      .eq("review_id", reviewId)
      .eq("used", false);

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: otpRow, error: otpIns } = await supabase
      .from("review_email_otps")
      .insert({
        email,
        code,
        review_id: reviewId,
        attempts: 0,
        used: false,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (otpIns || !otpRow?.id) {
      console.error("resend-otp insert:", otpIns);
      return NextResponse.json({ error: "otp_failed" }, { status: 500 });
    }

    const subject = "Verify your Tellacity review";
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111827;">
  <p>Hi ${guestName.replace(/</g, "&lt;")},</p>

  <p>Your Tellacity verification code is:</p>

  <h2 style="letter-spacing:4px">${code}</h2>

  <p>Enter this code in the verification window to publish your review.</p>

  <p>This code expires in 10 minutes.</p>
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
      console.error("resend-otp Resend:", mailErr);
      await supabase.from("review_email_otps").delete().eq("id", otpRow.id);
      return NextResponse.json({ error: "email_failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("resend-otp:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
