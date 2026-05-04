export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";
import {
  logInviteConvertedActivity,
  logReviewReceivedActivity,
} from "@/lib/logBusinessActivity";
import { isGeneralBusinessReviewRow } from "@/lib/reviewGeneralScope";
import { validatedProductPhotoIdForReview } from "@/lib/reviewProductPhotoId";
import { assertBusinessAcceptsPublicReviews } from "@/lib/businessPublicAccess";
import {
  evaluateProductReviewRateLimits,
  PRODUCT_REVIEW_RATE_LIMIT_MESSAGE,
} from "@/lib/productReviewRateLimits";
import {
  fetchBusinessDomainContext,
  isReviewerBlockedAsBusinessDomain,
  SAME_DOMAIN_REVIEW_ERROR_CODE,
  SAME_DOMAIN_REVIEW_MESSAGE,
} from "@/lib/reviewBusinessSelfReview";

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
  /** Optional: published business_photos row (item review). */
  product_photo_id?: string | null;
};

const getEffectiveEmail = async (
  req: Request,
  bodyEmail?: string,
): Promise<string> => {
  const cleanBodyEmail =
    typeof bodyEmail === "string" ? bodyEmail.trim().toLowerCase() : "";

  // PRIORITY: Always use form email if provided
  if (cleanBodyEmail && cleanBodyEmail.includes("@")) {
    return cleanBodyEmail;
  }

  // Fallback to auth token only if NO email provided
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
      // ignore
    }
  }
  return "";
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
  const invite_token =
    typeof body.invite_token === "string" ? body.invite_token.trim() : "";
  const rawBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!isUuid(business_id) || !invite_token || !rawBody) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const ratingNum = Number(body.rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const suspendedInvite = await assertBusinessAcceptsPublicReviews(
    supabase,
    business_id,
  );
  if (suspendedInvite) return suspendedInvite;

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
  if (!invEmail || !invEmail.includes("@")) {
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

  const domainCtxInvite = await fetchBusinessDomainContext(supabase, business_id);
  if (
    isReviewerBlockedAsBusinessDomain({
      reviewerEmailLower: invEmail,
      businessDomains: domainCtxInvite.domains,
      businessContactEmailLower: domainCtxInvite.contactEmailLower,
    })
  ) {
    return NextResponse.json(
      {
        error: SAME_DOMAIN_REVIEW_MESSAGE,
        error_code: SAME_DOMAIN_REVIEW_ERROR_CODE,
      },
      { status: 403 },
    );
  }

  const inviteRowId = invite.id as string;

  const { data: existingByGuest } = await supabase
    .from("reviews")
    .select("id, status, draft, visibility, product_photo_id")
    .eq("business_id", business_id)
    .eq("guest_email", invEmail)
    .limit(25);

  const guestRows = existingByGuest ?? [];
  const live = guestRows.find(
    (r) => rowIsPublicLiveReview(r) && isGeneralBusinessReviewRow(r),
  );
  if (live) {
    return NextResponse.json(
      { error: "You already have a published review for this business." },
      { status: 409 },
    );
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
    .maybeSingle();

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  if (!/^\d{6}$/.test(code)) {
    throw new Error(`OTP code generation failed: ${String(code)}`);
  }

  const reusedExistingDraft = Boolean(existingDraft?.id);
  let draftId: string;

  if (reusedExistingDraft && existingDraft?.id) {
    const existingId = String(existingDraft.id);
    const { data: updated, error: updErr } = await supabase
      .from("review_drafts")
      .update({
        business_id,
        rating: Math.round(ratingNum),
        title: titleVal,
        body: rawBody,
        email: invite.recipient_email,
        guest_name: guestNameForDraft,
      })
      .eq("id", existingId)
      .select("id")
      .single();

    if (updErr || !updated?.id) {
      console.error("REVIEW DRAFT UPDATE ERROR:", updErr);
      throw updErr ?? new Error("Draft update returned no id");
    }
    draftId = String(updated.id);
  } else {
    const { data: inserted, error: draftError } = await supabase
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
      console.error("REVIEW DRAFT INSERT ERROR:", draftError);
      throw draftError;
    }

    if (!inserted?.id) {
      throw new Error("Draft insert returned no id");
    }
    draftId = String(inserted.id);
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error: otpError } = await supabase.from("review_otps").insert({
    email: invite.recipient_email,
    code,
    draft_id: draftId,
    expires_at: expiresAt,
  });

  if (otpError) {
    console.error("review_otps insert error:", otpError);
    if (!reusedExistingDraft) {
      await supabase.from("review_drafts").delete().eq("id", draftId);
    }
    throw otpError;
  }

  if (!process.env.RESEND_API_KEY) {
    await supabase.from("review_otps").delete().eq("draft_id", draftId);
    if (!reusedExistingDraft) {
      await supabase.from("review_drafts").delete().eq("id", draftId);
    }
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
    await supabase.from("review_otps").delete().eq("draft_id", draftId);
    if (!reusedExistingDraft) {
      await supabase.from("review_drafts").delete().eq("id", draftId);
    }
    return NextResponse.json(
      { error: "Could not send verification email." },
      { status: 500 },
    );
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
  const inviteId =
    typeof body.invite_id === "string" ? body.invite_id.trim() : "";
  const isInvitePublish = inviteId && isUuid(inviteId);

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

  const suspendedGuest = await assertBusinessAcceptsPublicReviews(
    supabase,
    business_id,
  );
  if (suspendedGuest) return suspendedGuest;

  let productPhotoIdResolved: string | null = null;
  if (body.product_photo_id !== undefined && body.product_photo_id !== null) {
    const rawPid =
      typeof body.product_photo_id === "string" ? body.product_photo_id.trim() : "";
    if (rawPid) {
      productPhotoIdResolved = await validatedProductPhotoIdForReview(
        supabase,
        business_id,
        body.product_photo_id
      );
      if (!productPhotoIdResolved) {
        return NextResponse.json({ error: "Invalid item" }, { status: 400 });
      }
    }
  }

  const authUser = await getAuthUser(req);
  const isGoogleUser = !!authUser;

  const domainCtxGuest = await fetchBusinessDomainContext(supabase, business_id);
  const reviewerEmailForDomain = isInvitePublish
    ? effectiveEmail.trim().toLowerCase()
    : isGoogleUser
      ? (authUser?.email?.trim().toLowerCase() ?? "")
      : effectiveEmail.trim().toLowerCase();
  if (
    reviewerEmailForDomain &&
    isReviewerBlockedAsBusinessDomain({
      reviewerEmailLower: reviewerEmailForDomain,
      businessDomains: domainCtxGuest.domains,
      businessContactEmailLower: domainCtxGuest.contactEmailLower,
    })
  ) {
    return NextResponse.json(
      {
        error: SAME_DOMAIN_REVIEW_MESSAGE,
        error_code: SAME_DOMAIN_REVIEW_ERROR_CODE,
      },
      { status: 403 },
    );
  }

  let productRate:
    | Awaited<ReturnType<typeof evaluateProductReviewRateLimits>>
    | null = null;
  if (productPhotoIdResolved) {
    const emailLower = effectiveEmail.trim().toLowerCase();
    /** Invite publish rows are always guest-scoped (`user_id` null); match that for counts. */
    const rate = await evaluateProductReviewRateLimits(supabase, {
      businessId: business_id,
      guestEmailLower:
        isInvitePublish || !isGoogleUser ? emailLower : null,
      userId:
        isInvitePublish || !isGoogleUser ? null : authUser?.id ?? null,
    });
    if (rate.outcome === "block") {
      return NextResponse.json(
        {
          error: PRODUCT_REVIEW_RATE_LIMIT_MESSAGE,
          error_code: "product_review_rate_limit",
        },
        { status: 429 },
      );
    }
    productRate = rate;
  }

  if (isInvitePublish) {
    const guestEmailLower = effectiveEmail.trim().toLowerCase();
    try {
      const itemStatus =
        productPhotoIdResolved && productRate?.outcome === "allow"
          ? productRate.reviewStatus
          : "published";
      const { data: review, error: pubErr } = await supabase
        .from("reviews")
        .insert({
          business_id,
          rating: Math.round(ratingNum),
          title: titleVal,
          body: rawBody,
          guest_email: guestEmailLower,
          guest_name: guest_name_raw.slice(0, 200),
          user_id: null,
          consumer_id: null,
          date_of_experience,
          status: itemStatus,
          visibility: "visible",
          verification_status: "verified",
          draft: false,
          imported: false,
          marketing_opt_in,
          receipt_url,
          reference_number,
          invite_id: inviteId,
          is_flagged: false,
          ...(productPhotoIdResolved ? { product_photo_id: productPhotoIdResolved } : {}),
        })
        .select("id")
        .single();

      if (pubErr) {
        const anyPub = pubErr as { code?: string; message?: string };
        if (anyPub.code === "23505") {
          const m = String(anyPub.message ?? "").toLowerCase();
          const isProduct =
            m.includes("reviews_guest_product_photo_uniq") || Boolean(productPhotoIdResolved);
          return NextResponse.json(
            {
              error: isProduct
                ? "You've already reviewed this product."
                : "You have already reviewed this business.",
            },
            { status: 400 },
          );
        }
        console.error("guest invite direct publish:", pubErr);

        return NextResponse.json(
          {
            error: "publish_failed",
            details: pubErr?.message || pubErr,
            code: pubErr?.code || null,
          },
          { status: 500 }
        );
      }

      await supabase
        .from("review_invites")
        .update({
          status: "completed",
          review_submitted_at: new Date().toISOString(),
        })
        .eq("id", inviteId);

      if (review?.id) {
        await logReviewReceivedActivity({
          businessId: business_id,
          userId: null,
          reviewId: review.id,
          rating: Math.round(ratingNum),
        });
        void logInviteConvertedActivity({
          businessId: business_id,
          userId: null,
          inviteId: inviteId,
          reviewId: review.id,
        });
      }

      return NextResponse.json({
        requiresOtp: false,
        published: true,
        reviewId: review?.id ?? null,
        verification_email: effectiveEmail,
      });
    } catch (e) {
      console.error("guest invite publish error:", e);
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }
  }

  const { data: guestRows, error: existingError } = await supabase
    .from("reviews")
    .select("id, status, draft, visibility, created_at, product_photo_id")
    .eq("business_id", business_id)
    .eq("guest_email", effectiveEmail)
    .order("created_at", { ascending: false })
    .limit(25);

  if (existingError) {
    console.error("guest draft existing review lookup:", existingError);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  const list = guestRows ?? [];

  let pendingDraftBuilder = supabase
    .from("review_drafts")
    .select("id")
    .eq("business_id", business_id)
    .eq("email", effectiveEmail)
    .order("created_at", { ascending: false })
    .limit(1);
  if (productPhotoIdResolved) {
    pendingDraftBuilder = pendingDraftBuilder.eq(
      "product_photo_id",
      productPhotoIdResolved,
    );
  } else {
    pendingDraftBuilder = pendingDraftBuilder.is("product_photo_id", null);
  }

  const { data: pendingDraftRow, error: pendingDraftErr } =
    await pendingDraftBuilder.maybeSingle();

  if (pendingDraftErr) {
    console.error("guest draft review_drafts lookup:", pendingDraftErr);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }

  /** Supersede in-progress OTP for this exact scope (same business + email + product or general). */
  if (pendingDraftRow?.id) {
    const { error: supersedeErr } = await supabase
      .from("review_drafts")
      .delete()
      .eq("id", pendingDraftRow.id);
    if (supersedeErr) {
      console.error("guest draft supersede pending:", supersedeErr);
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }
  }

  if (productPhotoIdResolved) {
    const itemLive = list.find(
      (r) =>
        rowIsPublicLiveReview(r) &&
        r.product_photo_id != null &&
        String(r.product_photo_id) === String(productPhotoIdResolved),
    );
    if (itemLive?.id) {
      return NextResponse.json(
        {
          error: "duplicate_item_review",
          message: "You've already reviewed this product.",
        },
        { status: 409 },
      );
    }
  } else {
    const guestLive = list.find(
      (r) =>
        rowIsPublicLiveReview(r) && isGeneralBusinessReviewRow(r),
    );
    if (guestLive?.id) {
      return NextResponse.json(
        { requiresUpdate: true, reviewId: guestLive.id },
        { status: 200 },
      );
    }
  }

  if (isGoogleUser) {
    try {
      const directStatus =
        productPhotoIdResolved && productRate?.outcome === "allow"
          ? productRate.reviewStatus
          : "published";
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
          status: directStatus,
          visibility: "visible",
          verification_status: "verified",
          draft: false,
          imported: false,
          marketing_opt_in,
          receipt_url,
          reference_number,
          is_flagged: false,
          user_id: isGoogleUser ? authUser?.id : null,
          ...(productPhotoIdResolved ? { product_photo_id: productPhotoIdResolved } : {}),
        })
        .select("id")
        .single();

      if (insertErr || !inserted?.id) {
        const anyErr = insertErr as { code?: string } | null;
        if (anyErr?.code === "23505") {
          if (productPhotoIdResolved) {
            return NextResponse.json(
              {
                error: "duplicate_item_review",
                message: "You've already reviewed this product.",
              },
              { status: 409 },
            );
          }
          return NextResponse.json(
            { requiresUpdate: true, reviewId: null },
            { status: 200 },
          );
        }
        console.error("google verified direct insert:", insertErr);
        return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
      }

      await logReviewReceivedActivity({
        businessId: business_id,
        userId: authUser?.id ?? null,
        reviewId: inserted.id,
        rating: Math.round(ratingNum),
      });

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
      ...(productPhotoIdResolved ? { product_photo_id: productPhotoIdResolved } : {}),
    })
    .select("id")
    .single();

  if (draftError || !draft?.id) {
    console.error("guest draft insert:", draftError);
    const anyErr = draftError as { code?: string } | null;
    if (anyErr?.code === "23505") {
      return NextResponse.json(
        {
          error: "duplicate_review",
          message: productPhotoIdResolved
            ? "You've already reviewed this product."
            : undefined,
        },
        { status: 409 },
      );
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
    const inviteId =
      typeof body.invite_id === "string" ? body.invite_id.trim() : "";
    const isInvitePublish = inviteId && isUuid(inviteId);

    if (isInvitePublish) {
      return await guestPublicDraft(req, {
        ...body,
        invite_id: inviteId,
      });
    }

    const invite_token =
      typeof body.invite_token === "string" ? body.invite_token.trim() : "";

    if (invite_token) {
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
