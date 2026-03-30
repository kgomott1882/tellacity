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

    const { data: otp, error: otpError } = await supabase
      .from("review_otps")
      .select("*")
      .eq("draft_id", draftId)
      .eq("code", codeRaw)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("review_otps fetch error:", otpError);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }

    if (!otp) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const expiry = otp.expires_at
      ? new Date(otp.expires_at)
      : new Date(new Date(otp.created_at).getTime() + 10 * 60 * 1000);
    if (otp.expires_at && new Date(otp.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code expired" }, { status: 400 });
    }
    if (expiry < new Date()) {
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

    const d = draft as Record<string, unknown>;
    const inviteId = d.invite_id;
    const hasInvite =
      inviteId != null &&
      typeof inviteId === "string" &&
      inviteId.length > 0;

    const emailStr = String(d.email ?? "");
    const fromLocal = emailStr.includes("@")
      ? (emailStr.split("@")[0] ?? "").trim()
      : "";
    const guestName =
      (typeof d.guest_name === "string" && d.guest_name.trim()
        ? d.guest_name.trim()
        : fromLocal) || "Customer";

    const insertPayload: Record<string, unknown> = {
      business_id: draft.business_id,
      rating: draft.rating,
      title: draft.title,
      body: draft.body,
      guest_email: draft.email,
      guest_name: guestName,
      status: "published",
      verification_status: "pending",
      draft: false,
      imported: false,
      marketing_opt_in: Boolean(d.marketing_opt_in),
      visibility: "visible",
    };

    if (hasInvite) {
      insertPayload.invite_id = inviteId;
    }
    if (d.date_of_experience) {
      insertPayload.date_of_experience = d.date_of_experience;
    }
    if (d.receipt_url) {
      insertPayload.receipt_url = d.receipt_url;
    }
    if (d.reference_number) {
      insertPayload.reference_number = d.reference_number;
    }
    if (d.user_id) {
      insertPayload.user_id = d.user_id;
    }
    if (!d.user_id) {
      insertPayload.source = "guest";
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    const reviewId = review.id as string;

    if (hasInvite) {
      await supabase
        .from("review_invites")
        .update({
          review_submitted_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", inviteId);
    }

    await supabase.from("review_drafts").delete().eq("id", draftId);

    return NextResponse.json({
      success: true,
      review_id: reviewId,
    });
  } catch (err: any) {
    console.error("VERIFY ERROR:", err);

    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}
