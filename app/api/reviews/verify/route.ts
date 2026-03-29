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
 * Body: { draft_id, code } — no email from client; guest_email comes from review_drafts only.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody;
    const draftId =
      typeof body.draft_id === "string" ? body.draft_id.trim() : "";
    const codeRaw = typeof body.code === "string" ? body.code.trim() : "";

    if (!isValidUuid(draftId) || !isSixDigitCode(codeRaw)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: otpRows, error: otpFetchErr } = await supabase
      .from("consumer_otps")
      .select("*")
      .eq("code", codeRaw)
      .order("created_at", { ascending: false })
      .limit(5);

    if (otpFetchErr) {
      console.error("consumer_otps fetch error:", otpFetchErr);
      return NextResponse.json(
        { error: "Something went wrong" },
        { status: 500 },
      );
    }

    const otp = (otpRows ?? []).find(
      (row) =>
        String(row.draft_id ?? "") === draftId &&
        (row.type == null || row.type === "review_verification") &&
        row.used_at == null,
    );

    if (!otp) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const createdAt = otp.created_at
      ? new Date(String(otp.created_at))
      : null;
    if (
      !createdAt ||
      Number.isNaN(createdAt.getTime()) ||
      createdAt.getTime() < Date.now() - 10 * 60 * 1000
    ) {
      return NextResponse.json({ error: "OTP expired" }, { status: 400 });
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

    if (
      otp.email &&
      draft.email &&
      String(otp.email).trim().toLowerCase() !==
        String(draft.email).trim().toLowerCase()
    ) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const guestEmail = String(draft.email ?? "").trim().toLowerCase();
    if (!guestEmail) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const insertPayload: Record<string, unknown> = {
      business_id: draft.business_id,
      rating: draft.rating,
      title: draft.title ?? null,
      body: draft.body,
      invite_id: draft.invite_id,
      guest_email: guestEmail,
      guest_name: String(draft.guest_name ?? "Customer").trim() || "Customer",
      status: "published",
      visibility: "visible",
      draft: false,
    };

    if (draft.user_id) {
      insertPayload.user_id = draft.user_id;
      insertPayload.guest_email = null;
    }

    if (draft.date_of_experience) {
      insertPayload.date_of_experience = draft.date_of_experience;
    }
    if (typeof draft.marketing_opt_in === "boolean") {
      insertPayload.marketing_opt_in = draft.marketing_opt_in;
    }
    if (draft.receipt_url) {
      insertPayload.receipt_url = draft.receipt_url;
    }
    if (draft.reference_number) {
      insertPayload.reference_number = draft.reference_number;
    }
    if (!draft.user_id) {
      insertPayload.source = "guest";
    }

    const { data: review, error: insertErr } = await supabase
      .from("reviews")
      .insert(insertPayload)
      .select("id")
      .single();

    if (insertErr || !review?.id) {
      console.error("REVIEW INSERT ERROR:", insertErr);
      return NextResponse.json(
        { error: insertErr?.message ?? "Failed to publish review" },
        { status: 500 },
      );
    }

    const otpId = otp.id as string | undefined;
    if (otpId) {
      const { error: markOtpErr } = await supabase
        .from("consumer_otps")
        .update({ used_at: new Date().toISOString() })
        .eq("id", otpId);
      if (markOtpErr) {
        console.error("consumer_otps mark used error:", markOtpErr);
      }
    }

    const nowIso = new Date().toISOString();
    const inviteUpdate: Record<string, unknown> = {
      review_submitted_at: nowIso,
      status: "completed",
    };
    if (draft.invite_id) {
      const { error: inviteErr } = await supabase
        .from("review_invites")
        .update({ ...inviteUpdate, used_at: nowIso })
        .eq("id", draft.invite_id);
      if (inviteErr) {
        console.error("review_invites update error:", inviteErr);
      }
    }

    const { error: delDraftErr } = await supabase
      .from("review_drafts")
      .delete()
      .eq("id", draftId);
    if (delDraftErr) {
      console.error("review_drafts delete error:", delDraftErr);
    }

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
