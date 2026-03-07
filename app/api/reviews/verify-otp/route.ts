export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

type VerifyOtpBody = {
  reviewId?: string;
  code?: string;
};

function isValidUuid(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isSixDigitCode(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9]{6}$/.test(value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyOtpBody;
    const reviewId = typeof body.reviewId === "string" ? body.reviewId.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";

    if (!isValidUuid(reviewId) || !isSixDigitCode(code)) {
      return NextResponse.json(
        { error: "otp_invalid" },
        { status: 400 },
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: otpRecords, error: otpError } = await supabase
      .from("review_email_otps")
      .select("*")
      .eq("review_id", reviewId)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpError) {
      console.error("Failed to fetch review_email_otps:", otpError);
      return NextResponse.json(
        { error: "unexpected_error" },
        { status: 500 },
      );
    }

    const otp = otpRecords?.[0];
    if (!otp) {
      return NextResponse.json(
        { error: "otp_invalid" },
        { status: 400 },
      );
    }

    const now = new Date();
    if (otp.expires_at && new Date(otp.expires_at) < now) {
      return NextResponse.json(
        { error: "otp_expired" },
        { status: 400 },
      );
    }

    if (typeof otp.attempts === "number" && otp.attempts >= 5) {
      return NextResponse.json(
        { error: "otp_invalid" },
        { status: 400 },
      );
    }

    if (otp.code !== code) {
      const { error: updateAttemptsError } = await supabase
        .from("review_email_otps")
        .update({ attempts: (otp.attempts ?? 0) + 1 })
        .eq("id", otp.id);

      if (updateAttemptsError) {
        console.error(
          "Failed to increment OTP attempts:",
          updateAttemptsError,
        );
      }

      return NextResponse.json(
        { error: "otp_invalid" },
        { status: 400 },
      );
    }

    const { error: markUsedError } = await supabase
      .from("review_email_otps")
      .update({ used: true })
      .eq("id", otp.id);

    if (markUsedError) {
      console.error("Failed to mark OTP as used:", markUsedError);
      return NextResponse.json(
        { error: "unexpected_error" },
        { status: 500 },
      );
    }

    const { error: publishError } = await supabase
      .from("reviews")
      .update({
        status: "published",
        verified_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (publishError) {
      console.error("Failed to publish review:", publishError);
      return NextResponse.json(
        { error: "unexpected_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-otp handler error:", err);
    return NextResponse.json(
      { error: "unexpected_error" },
      { status: 500 },
    );
  }
}

