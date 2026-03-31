export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";
import { resolveReviewGuestEmail } from "@/lib/reviewSessionEmail";
import {
  isValidInviteToken,
  normalizeInviteToken,
  reviewInviteRowIsExpired,
  reviewInviteRowIsUsed,
  type InviteRowRecord,
} from "@/lib/reviewInviteValidation";

const resend = new Resend(process.env.RESEND_API_KEY ?? "");

type Body = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  invite_token?: string | null;
  invite_id?: string | null;
  guest_email?: string;
  guest_name?: string;
  date_of_experience?: string | null;
  marketing_opt_in?: boolean | null;
  receipt_url?: string | null;
  reference_number?: string | null;
};

type OtpLookupRow = {
  id: string;
  draft_id: string;
  created_at: string;
  expires_at: string | null;
};

function otpIsStillValid(row: OtpLookupRow): boolean {
  const deadline = row.expires_at
    ? new Date(String(row.expires_at)).getTime()
    : new Date(String(row.created_at)).getTime() + 10 * 60 * 1000;
  if (Number.isNaN(deadline)) return false;
  return deadline >= Date.now();
}

const getEffectiveEmail = async (
  req: Request,
  bodyEmail?: string,
): Promise<string> => {
  const authHeader = req.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (bearer) {
    try {
      const { supabaseUrl, serviceRoleKey } = getServerEnv();
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data, error } = await supabase.auth.getUser(bearer);
      if (!error) {
        const tokenEmail = data.user?.email?.trim().toLowerCase() ?? "";
        if (tokenEmail) return tokenEmail;
      }
    } catch {
      // fallback below
    }
  }
  return resolveReviewGuestEmail(
    typeof bodyEmail === "string" ? bodyEmail.trim().toLowerCase() : "",
  );
};

const getAuthUser = async (req: Request) => {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";
  if (!token) return null;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);
    return user ?? null;
  } catch {
    return null;
  }
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
 * Invite link: review_drafts + review_otps + email (recipient must match invite).
 */
async function inviteOtpDraft(req: Request, body: Body): Promise<NextResponse> {
  const business_id =
    typeof body.business_id === "string" ? body.business_id.trim() : "";
  const invite_token = normalizeInviteToken(body.invite_token);
  const invite_id =
    typeof body.invite_id === "string" ? body.invite_id.trim() : "";
  const rawBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!isUuid(business_id) || !rawBody) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const hasInviteId = isUuid(invite_id);
  const hasInviteToken = !!invite_token && isValidInviteToken(invite_token);
  if (!hasInviteId && !hasInviteToken) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ratingNum = Number(body.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const inviteQuery = supabase
    .from("review_invites")
    .select("id, business_id, recipient_email, review_submitted_at, expires_at");
  const { data: invite, error: invErr } = hasInviteId
    ? await inviteQuery.eq("id", invite_id).maybeSingle()
    : await inviteQuery.eq("token", invite_token).maybeSingle();

  if (invErr || !invite) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }
  const inviteRow = invite as InviteRowRecord;

  if (String(invite.business_id) !== business_id) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const effectiveEmail = await getEffectiveEmail(req, body.guest_email);
  if (!effectiveEmail || !effectiveEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const isGoogleUser = !!(await getAuthUser(req));

  const invEmail = String(invite.recipient_email ?? "").trim().toLowerCase();
  if (!invEmail || invEmail !== effectiveEmail) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  if (reviewInviteRowIsUsed(inviteRow)) {
    return NextResponse.json(
      { error: "This invite has already been used." },
      { status: 400 },
    );
  }

  if (reviewInviteRowIsExpired(inviteRow)) {
    return NextResponse.json({ error: "Invite expired" }, { status: 400 });
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

  const titleVal =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : null;

  const guestNameFromBody =
    typeof body.guest_name === "string" && body.guest_name.trim()
      ? body.guest_name.trim().slice(0, 200)
      : "";
  const guestNameForDraft =
    guestNameFromBody ||
    (invEmail.includes("@") ? invEmail.split("@")[0] ?? "" : "").trim() ||
    "Customer";

  const { data: existingDraft } = await supabase
    .from("review_drafts")
    .select("id")
    .eq("invite_id", inviteRowId)
    .ilike("email", invEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existingDraftId = String(existingDraft?.id ?? "").trim();
  if (existingDraftId) {
    return NextResponse.json({
      success: true,
      draft_id: existingDraftId,
      verification_email: invEmail,
    });
  }

  let draftId = "";
  {
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
      .select("id")
      .single();

    if (draftError) {
      const draftErr = draftError as { code?: string };
      if (draftErr?.code === "23505") {
        // Unique race: fetch the existing row and return it instead of failing.
        const { data: racedDraft } = await supabase
          .from("review_drafts")
          .select("id")
          .eq("invite_id", inviteRowId)
          .ilike("email", invEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const racedDraftId = String(racedDraft?.id ?? "").trim();
        if (racedDraftId) {
          return NextResponse.json({
            success: true,
            draft_id: racedDraftId,
            verification_email: invEmail,
          });
        }
      }
      console.error("REVIEW DRAFT INSERT ERROR:", draftError);
      throw draftError;
    }
    draftId = String(draft?.id ?? "").trim();
    if (!draftId) {
      throw new Error("Draft insert returned no id");
    }
  }

  const { data: latestOtpRows, error: otpLookupErr } = await supabase
    .from("review_otps")
    .select("id, draft_id, created_at, expires_at")
    .eq("draft_id", draftId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (otpLookupErr) {
    console.error("review_otps lookup error:", otpLookupErr);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  const latestOtp = (latestOtpRows?.[0] as OtpLookupRow | undefined) ?? undefined;
  const hasActiveOtp = latestOtp ? otpIsStillValid(latestOtp) : false;

  if (!hasActiveOtp) {
    await supabase.from("review_otps").delete().eq("draft_id", draftId);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: otpError } = await supabase.from("review_otps").insert({
      email: invite.recipient_email,
      code,
      draft_id: draftId,
      expires_at: expiresAt,
    });

    if (otpError) {
      console.error("review_otps insert error:", otpError);
      throw otpError;
    }
  }

  if (!process.env.RESEND_API_KEY) {
    await supabase.from("review_otps").delete().eq("draft_id", draftId);
    await supabase.from("review_drafts").delete().eq("id", draftId);
    return NextResponse.json(
      { error: "Email is not configured. Please try again later." },
      { status: 503 },
    );
  }

  if (!hasActiveOtp) {
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
      await supabase.from("review_otps").delete().eq("draft_id", draftId);
      await supabase.from("review_drafts").delete().eq("id", draftId);
      return NextResponse.json(
        { error: "Could not send verification email." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    success: true,
    draft_id: draftId,
    verification_email: invEmail,
  });
}

/**
 * Public /write-review guest path: no invite token; same draft + OTP + Resend as edge function.
 */
async function guestPublicDraft(req: Request, body: Body): Promise<NextResponse> {
  const business_id =
    typeof body.business_id === "string" ? body.business_id.trim() : "";
  const rawBody = typeof body.body === "string" ? body.body.trim() : "";
  const guest_name_raw =
    typeof body.guest_name === "string" ? body.guest_name.trim() : "";

  if (!isUuid(business_id) || !rawBody) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ratingNum = Number(body.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const effectiveEmail = await getEffectiveEmail(req, body.guest_email);
  if (!effectiveEmail || !effectiveEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const isGoogleUser = !!(await getAuthUser(req));

  if (!guest_name_raw) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

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

  const marketing_opt_in = Boolean(body.marketing_opt_in);
  const receipt_url =
    typeof body.receipt_url === "string" && body.receipt_url.trim()
      ? body.receipt_url.trim()
      : null;
  const reference_number =
    typeof body.reference_number === "string" && body.reference_number.trim()
      ? body.reference_number.trim()
      : null;
  const titleVal =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : null;

  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: guestRows, error: existingError } = await supabase
    .from("reviews")
    .select("id, status, draft, visibility, created_at")
    .eq("business_id", business_id)
    .eq("guest_email", effectiveEmail)
    .order("created_at", { ascending: false })
    .limit(25);

  if (existingError) {
    console.error("guest draft existing review lookup:", existingError);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  const list = guestRows ?? [];

  const { data: pendingDraftRow, error: pendingDraftErr } = await supabase
    .from("review_drafts")
    .select("id")
    .eq("business_id", business_id)
    .eq("email", effectiveEmail)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingDraftErr) {
    console.error("guest draft review_drafts lookup:", pendingDraftErr);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  if (pendingDraftRow?.id) {
    return NextResponse.json(
      {
        error: "draft_exists",
        draft_id: pendingDraftRow.id,
        verification_email: effectiveEmail,
      },
      { status: 409 },
    );
  }

  const guestLive = list.find((r) => rowIsPublicLiveReview(r));
  if (guestLive?.id) {
    return NextResponse.json(
      { requiresUpdate: true, reviewId: guestLive.id },
      { status: 200 },
    );
  }

  if (isGoogleUser) {
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from("reviews")
        .insert({
          business_id,
          rating: Math.round(ratingNum),
          title: titleVal,
          body: rawBody,
          guest_email: effectiveEmail,
          guest_name: guest_name_raw.slice(0, 200),
          date_of_experience,
          status: "published",
          visibility: "visible",
          verification_status: "verified",
          draft: false,
          imported: false,
          marketing_opt_in,
          receipt_url,
          reference_number,
          is_flagged: false,
        })
        .select("id")
        .single();

      if (insertErr || !inserted?.id) {
        const anyErr = insertErr as { code?: string } | null;
        if (anyErr?.code === "23505") {
          return NextResponse.json(
            { requiresUpdate: true, reviewId: null },
            { status: 200 },
          );
        }
        console.error("google verified direct insert:", insertErr);
        return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
      }

      return NextResponse.json({
        published: true,
        reviewId: inserted.id,
        verification_email: effectiveEmail,
      });
    } catch (err) {
      console.error("google verified publish error:", err);
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }
  }

  const { data: draft, error: draftError } = await supabase
    .from("review_drafts")
    .insert({
      business_id,
      rating: Math.round(ratingNum),
      title: titleVal,
      body: rawBody,
      email: effectiveEmail,
      guest_name: guest_name_raw.slice(0, 200),
      date_of_experience: date_of_experience,
      marketing_opt_in,
      receipt_url,
      reference_number,
    })
    .select("id")
    .single();

  if (draftError || !draft?.id) {
    console.error("guest draft insert:", draftError);
    const anyErr = draftError as { code?: string } | null;
    if (anyErr?.code === "23505") {
      return NextResponse.json({ error: "duplicate_review" }, { status: 409 });
    }
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  if (!/^\d{6}$/.test(code)) {
    await supabase.from("review_drafts").delete().eq("id", draft.id);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: otpError } = await supabase.from("review_otps").insert({
    email: effectiveEmail,
    code,
    draft_id: draft.id,
    expires_at: expiresAt,
  });

  if (otpError) {
    console.error("guest draft review_otps:", otpError);
    await supabase.from("review_drafts").delete().eq("id", draft.id);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
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
      to: effectiveEmail,
      subject: "Your verification code",
      html: `<p>Your verification code is <strong>${code}</strong></p>`,
    });
    if (sendRes.error) {
      throw sendRes.error;
    }
  } catch (mailErr) {
    console.error("guest draft RESEND:", mailErr);
    await supabase.from("review_otps").delete().eq("draft_id", draft.id);
    await supabase.from("review_drafts").delete().eq("id", draft.id);
    return NextResponse.json(
      { error: "Could not send verification email." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    requiresOtp: true,
    draft_id: draft.id,
    verification_email: effectiveEmail,
  });
}

/**
 * POST /api/reviews/create-draft
 * - With `invite_token`: invite OTP step (two-step invite page).
 * - Without `invite_token`: public write-review guest OTP (replaces edge function).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const invite_token =
      typeof body.invite_token === "string" ? body.invite_token.trim() : "";
    const invite_id =
      typeof body.invite_id === "string" ? body.invite_id.trim() : "";

    if (invite_token || invite_id) {
      return await inviteOtpDraft(req, body);
    }

    return await guestPublicDraft(req, body);
  } catch (error: any) {
    console.error("CREATE DRAFT ERROR:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "unexpected_error",
        details: error,
      }),
      { status: 500 },
    );
  }
}
