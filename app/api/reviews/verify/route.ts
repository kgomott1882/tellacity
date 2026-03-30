export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

type VerifyBody = {
  draft_id?: string;
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
  return /^[0-9]{6}$/.test(value.trim());
}

/**
 * POST /api/reviews/verify
 * Body: { draft_id, code } — verify OTP, publish review, mark invite used, cleanup draft + OTP.
 */
export async function POST(req: Request) {
  try {
    const { draft_id, code } = (await req.json()) as VerifyBody;
    const draftId =
      typeof draft_id === "string" ? draft_id.trim() : "";
    const codeRaw = typeof code === "string" ? code.trim() : "";

    if (!isValidUuid(draftId) || !isSixDigitCode(codeRaw)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: otp, error: otpFetchErr } = await supabase
      .from("review_otps")
      .select("*")
      .eq("draft_id", draftId)
      .eq("code", codeRaw)
      .is("used_at", null)
      .maybeSingle();

    if (otpFetchErr) {
      console.error("review_otps fetch error:", otpFetchErr);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }

    if (!otp) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const exp = otp.expires_at ? new Date(String(otp.expires_at)) : null;
    if (!exp || Number.isNaN(exp.getTime()) || exp < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }

    const { data: draft, error: draftErr } = await supabase
      .from("review_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();

    if (draftErr) {
      console.error("review_drafts fetch error:", draftErr);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        business_id: draft.business_id,
        rating: draft.rating,
        title: draft.title,
        body: draft.body,
        invite_id: draft.invite_id,
        guest_email: draft.email,
        status: "published",
        visibility: "visible",
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from("review_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otp.id);

    await supabase
      .from("review_invites")
      .update({
        review_submitted_at: new Date().toISOString(),
        used_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", draft.invite_id);

    await supabase.from("review_drafts").delete().eq("id", draft.id);

    return NextResponse.json({
      success: true,
      review_id: review.id,
    });
  } catch (e) {
    console.error("/api/reviews/verify error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
