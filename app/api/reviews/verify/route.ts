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
      .order("created_at", { ascending: false })
      .limit(1)
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

    const otpRow = otp as Record<string, unknown>;
    const nowMs = Date.now();
    let deadlineMs: number | null = null;
    if (otpRow.expires_at) {
      const d = new Date(String(otpRow.expires_at));
      if (!Number.isNaN(d.getTime())) deadlineMs = d.getTime();
    }
    if (deadlineMs == null && otpRow.created_at) {
      const c = new Date(String(otpRow.created_at));
      if (!Number.isNaN(c.getTime())) {
        deadlineMs = c.getTime() + 10 * 60 * 1000;
      }
    }
    if (deadlineMs == null || deadlineMs < nowMs) {
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

    const guestEmailStr = String(draft.email ?? "").trim().toLowerCase();
    const draftRow = draft as Record<string, unknown>;
    const guestNameFromDraft =
      typeof draftRow.guest_name === "string" && draftRow.guest_name.trim()
        ? draftRow.guest_name.trim()
        : "";
    const guestNameResolved =
      guestNameFromDraft ||
      (guestEmailStr.includes("@")
        ? (guestEmailStr.split("@")[0] ?? "").trim()
        : "") ||
      "Customer";

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        business_id: draft.business_id,
        rating: draft.rating,
        title: draft.title,
        body: draft.body,

        invite_id: draft.invite_id,
        guest_email: draft.email,
        guest_name: guestNameResolved,

        // REQUIRED FIELDS
        status: "published",
        verification_status: "verified",
        verified_at: new Date().toISOString(),
        draft: false,
        imported: false,
        marketing_opt_in: false,

        // OPTIONAL BUT SAFE
        visibility: "visible",
      })
      .select()
      .single();

    if (error) throw error;

    const reviewId = review.id as string;
    const submittedAt = new Date().toISOString();

    // Match create-review-draft edge function: never set review_invites.used_at (often absent in prod).
    const { error: inviteErr } = await supabase
      .from("review_invites")
      .update({
        review_submitted_at: submittedAt,
        status: "completed",
      })
      .eq("id", draft.invite_id);

    if (inviteErr) {
      const { error: inviteErrMinimal } = await supabase
        .from("review_invites")
        .update({ review_submitted_at: submittedAt })
        .eq("id", draft.invite_id);
      if (inviteErrMinimal) {
        console.error("VERIFY: review_invites update failed:", inviteErr, inviteErrMinimal);
        await supabase.from("reviews").delete().eq("id", reviewId);
        throw inviteErrMinimal;
      }
    }

    // Removes draft; review_otps rows cascade on draft_id FK.
    const { error: delDraftErr } = await supabase
      .from("review_drafts")
      .delete()
      .eq("id", draft.id);
    if (delDraftErr) {
      console.error("VERIFY: review_drafts delete failed:", delDraftErr);
    }

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
