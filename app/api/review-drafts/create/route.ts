export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function normEmail(value: string): string {
  return value.trim().toLowerCase();
}

type Body = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  guest_email?: string;
  guest_name?: string;
  invite_id?: string;
  date_of_experience?: string | null;
  receipt_url?: string | null;
  /** Default: publish to `reviews` when invite is valid. Use `draft` only for OTP two-step flows. */
  intent?: "draft" | "publish";
};

type InviteRow = {
  id: string;
  business_id: string;
  recipient_email?: string | null;
  review_submitted_at?: string | null;
  expires_at?: string | null;
};

/**
 * Invite guest flow:
 * - Default (`intent` omitted or `publish`): validate invite → insert published `reviews` row → mark invite used.
 * - `intent: 'draft'`: legacy OTP path — insert `review_drafts` only.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const business_id =
      typeof body.business_id === "string" ? body.business_id.trim() : "";
    const invite_id =
      typeof body.invite_id === "string" ? body.invite_id.trim() : "";
    const rawBody = typeof body.body === "string" ? body.body.trim() : "";
    const guest_email =
      typeof body.guest_email === "string" ? body.guest_email.trim() : "";
    const guest_name_raw =
      typeof body.guest_name === "string" ? body.guest_name.trim() : "";

    if (!isUuid(business_id) || !isUuid(invite_id) || !rawBody) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!guest_email || !guest_email.includes("@")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ratingNum = Number(body.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const guest_name =
      guest_name_raw.slice(0, 200) ||
      (guest_email.includes("@")
        ? (guest_email.split("@")[0] ?? "").slice(0, 200)
        : "") ||
      "Customer";

    const titleVal =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : null;

    let date_of_experience: string | null = null;
    if (
      typeof body.date_of_experience === "string" &&
      body.date_of_experience.trim()
    ) {
      const d = body.date_of_experience.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const parsed = new Date(d);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      date_of_experience = d;
    }

    const receipt_url =
      typeof body.receipt_url === "string" && body.receipt_url.trim()
        ? body.receipt_url.trim()
        : null;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const intent = body.intent === "draft" ? "draft" : "publish";

    if (intent === "draft") {
      const { data, error } = await supabase
        .from("review_drafts")
        .insert({
          business_id,
          rating: Math.round(ratingNum),
          title: titleVal,
          body: rawBody,
          email: guest_email,
          guest_name,
          invite_id,
          date_of_experience,
          receipt_url,
        })
        .select("id")
        .single();

      if (error) {
        console.error("review-drafts create:", error);
        return NextResponse.json(
          { error: error.message || "Failed to save draft" },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        draft_id: data?.id ?? null,
        published: false,
      });
    }

    const { data: inviteRow, error: inviteErr } = await supabase
      .from("review_invites")
      .select("id, business_id, recipient_email, review_submitted_at, expires_at")
      .eq("id", invite_id)
      .maybeSingle();

    if (inviteErr || !inviteRow) {
      console.error("review-invites lookup:", inviteErr);
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const inv = inviteRow as InviteRow;
    if (String(inv.business_id ?? "").trim() !== business_id) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const invitedTo = normEmail(String(inv.recipient_email ?? ""));
    const submitter = normEmail(guest_email);
    if (!invitedTo || invitedTo !== submitter) {
      return NextResponse.json(
        { error: "This review must be submitted with the invited email address." },
        { status: 400 },
      );
    }

    if (inv.review_submitted_at) {
      return NextResponse.json(
        { error: "This invite has already been used." },
        { status: 400 },
      );
    }

    if (inv.expires_at && new Date(String(inv.expires_at)) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    const reviewPayload = {
      business_id,
      rating: Math.round(ratingNum),
      title: titleVal,
      body: rawBody,
      guest_name: guest_name.slice(0, 200),
      guest_email: submitter,
      date_of_experience,
      status: "published" as const,
      visibility: "visible" as const,
      verification_status: "verified" as const,
      draft: false,
      imported: false,
      marketing_opt_in: false,
      invite_id,
      receipt_url,
      reference_number: null,
      user_id: null,
      is_flagged: false,
    };

    const { data: insertedRow, error: insertReviewError } = await supabase
      .from("reviews")
      .insert([reviewPayload])
      .select()
      .single();

    if (insertReviewError) {
      console.error("INSERT REVIEW FAILED:", insertReviewError);
      return NextResponse.json(
        {
          error: "Insert failed",
          details: insertReviewError.message,
          code: insertReviewError.code,
          hint: insertReviewError.hint,
        },
        { status: 500 },
      );
    }

    const publishedReviewId =
      insertedRow && typeof (insertedRow as { id?: string }).id === "string"
        ? (insertedRow as { id: string }).id
        : null;

    const { error: updErr } = await supabase
      .from("review_invites")
      .update({
        review_submitted_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", invite_id);

    if (updErr) {
      console.error("review_invites update after publish:", updErr);
    }

    return NextResponse.json({
      success: true,
      published: true,
      review_id: publishedReviewId,
      draft_id: null,
    });
  } catch (e) {
    console.error("review-drafts create:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
