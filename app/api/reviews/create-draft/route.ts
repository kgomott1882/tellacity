export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

type Body = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  invite_token?: string;
  guest_email?: string;
  guest_name?: string;
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

function rowIsPublicLiveReview(row: {
  draft?: boolean | null;
  status?: string | null;
  visibility?: string | null;
}): boolean {
  if (row.draft === true) return false;
  const st = row.status;
  if (st && st !== "published") return false;
  const vis = String(row.visibility ?? "visible").trim().toLowerCase();
  return vis === "visible";
}

/**
 * Invite OTP step 1: review_drafts + review_otps + email. Guest-only (invite token + email);
 * no JWT, no supabase.auth.getUser(), no auth.users. Server uses service role for DB writes only.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const business_id = typeof body.business_id === "string" ? body.business_id.trim() : "";
    const invite_token =
      typeof body.invite_token === "string" ? body.invite_token.trim() : "";
    const rawBody = typeof body.body === "string" ? body.body.trim() : "";
    const guest_email_raw =
      typeof body.guest_email === "string" ? body.guest_email.trim().toLowerCase() : "";

    if (!isUuid(business_id) || !invite_token || !rawBody) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ratingNum = Number(body.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    if (!guest_email_raw || !guest_email_raw.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Server-side DB access only (no JWT / auth.users). Not tied to logged-in users.
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: invite, error: invErr } = await supabase
      .from("review_invites")
      .select("id, business_id, recipient_email, review_submitted_at, expires_at")
      .eq("token", invite_token)
      .maybeSingle();

    if (invErr || !invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    if (String(invite.business_id) !== business_id) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const invEmail = String(invite.recipient_email ?? "").trim().toLowerCase();
    if (!invEmail || invEmail !== guest_email_raw) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    if (invite.review_submitted_at) {
      return NextResponse.json(
        { error: "This invite has already been used." },
        { status: 400 },
      );
    }

    if (invite.expires_at) {
      const exp = new Date(String(invite.expires_at));
      if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        return NextResponse.json({ error: "Invite expired" }, { status: 400 });
      }
    }

    const inviteRowId = invite.id as string;

    const { data: existingByGuest } = await supabase
      .from("reviews")
      .select("id, status, draft, visibility")
      .eq("business_id", business_id)
      .eq("guest_email", invEmail)
      .limit(25);

    const guestRows = existingByGuest ?? [];
    const live = guestRows.find((r) => rowIsPublicLiveReview(r));
    if (live) {
      return NextResponse.json(
        { error: "You already have a published review for this business." },
        { status: 409 },
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!/^\d{6}$/.test(code)) {
      throw new Error(`OTP code generation failed: ${String(code)}`);
    }

    await supabase.from("review_drafts").delete().eq("invite_id", inviteRowId);

    const titleVal =
      typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

    const guestNameFromBody =
      typeof body.guest_name === "string" && body.guest_name.trim()
        ? body.guest_name.trim().slice(0, 200)
        : "";
    const guestNameForDraft =
      guestNameFromBody ||
      (invEmail.includes("@") ? invEmail.split("@")[0] ?? "" : "").trim() ||
      "Customer";

    const { data: draft, error: draftError } = await supabase
      .from("review_drafts")
      .insert({
        business_id,
        rating: Math.round(ratingNum),
        title: titleVal,
        body: rawBody,
        invite_id: inviteRowId,
        email: invite.recipient_email,
        guest_name: guestNameForDraft,
      })
      .select()
      .single();

    if (draftError) {
      console.error("REVIEW DRAFT INSERT ERROR:", draftError);
      throw draftError;
    }

    if (!draft?.id) {
      throw new Error("Draft insert returned no id");
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: otpError } = await supabase.from("review_otps").insert({
      email: invite.recipient_email,
      code,
      draft_id: draft.id,
      expires_at: expiresAt,
    });

    if (otpError) {
      console.error("review_otps insert error:", otpError);
      await supabase.from("review_drafts").delete().eq("id", draft.id);
      throw otpError;
    }

    if (!process.env.RESEND_API_KEY) {
      await supabase.from("review_otps").delete().eq("draft_id", draft.id);
      await supabase.from("review_drafts").delete().eq("id", draft.id);
      return NextResponse.json(
        { error: "Email is not configured. Please try again later." },
        { status: 503 },
      );
    }

    try {
      const sendRes = await resend.emails.send({
        from: resendFromHeader(),
        to: invite.recipient_email as string,
        subject: "Your verification code",
        html: `<p>Your verification code is <strong>${code}</strong></p>`,
      });
      if (sendRes.error) {
        throw sendRes.error;
      }
    } catch (mailErr) {
      console.error("RESEND ERROR:", mailErr);
      await supabase.from("review_otps").delete().eq("draft_id", draft.id);
      await supabase.from("review_drafts").delete().eq("id", draft.id);
      return NextResponse.json(
        { error: "Could not send verification email." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      draft_id: draft.id,
    });
  } catch (e: unknown) {
    console.error("/api/reviews/create-draft error:", e);
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message)
        : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
