export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import {
  logInviteConvertedActivity,
  logReviewReceivedActivity,
} from "@/lib/logBusinessActivity";
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

type ReviewDraftRow = {
  id: string;
  business_id: string;
  rating: number;
  title: string | null;
  body: string;
  email: string;
  guest_name: string | null;
  invite_id: string | null;
  date_of_experience: string | null;
  marketing_opt_in: boolean | null;
  receipt_url: string | null;
  reference_number: string | null;
  user_id: string | null;
  product_photo_id?: string | null;
};

type OtpRow = {
  id: string;
  draft_id: string;
  code: string;
  email: string;
  created_at: string;
  expires_at: string | null;
  used_at?: string | null;
};

/** Extra window after `expires_at` to reduce false “expired” from clock skew, DB latency, or slow mobile networks. */
const OTP_EXPIRY_GRACE_MS = 120_000;

function otpExpiresAtMs(row: OtpRow): number {
  if (row.expires_at) {
    const t = new Date(String(row.expires_at)).getTime();
    if (!Number.isNaN(t)) return t;
  }
  return new Date(row.created_at).getTime() + 10 * 60 * 1000;
}

function otpNotExpired(row: OtpRow): boolean {
  const deadline = otpExpiresAtMs(row);
  if (Number.isNaN(deadline)) return false;
  return Date.now() <= deadline + OTP_EXPIRY_GRACE_MS;
}

function codesMatch(stored: unknown, input: string): boolean {
  return String(stored ?? "").trim() === input.trim();
}

/** Stable UUID for inserts; DB may return uuid/null, never rely on truthiness alone. */
function normalizeDraftProductPhotoId(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s || !isValidUuid(s)) return null;
  return s;
}

/**
 * Uses Postgres error message (constraint / index name) so we don't mis-label
 * business-scope duplicates as "product" when product_photo_id was omitted.
 */
function duplicateReviewMessageFromPgError(
  pgMessage: string,
  fallbackHadProductScope: boolean,
): string {
  const m = pgMessage.toLowerCase();
  if (
    m.includes("reviews_guest_product_photo_uniq") ||
    (m.includes("product_photo") && m.includes("uniq"))
  ) {
    return "You've already reviewed this product.";
  }
  if (
    m.includes("reviews_guest_business_no_product_uniq") ||
    m.includes("reviews_business_id_guest_email") ||
    m.includes("reviews_guest_email_business") ||
    (m.includes("business_id") && m.includes("guest_email") && m.includes("uniq"))
  ) {
    return "You have already reviewed this business.";
  }
  return fallbackHadProductScope
    ? "You've already reviewed this product."
    : "You have already reviewed this business.";
}

function reviewRowIsPublicLive(row: {
  draft?: boolean | null;
  status?: string | null;
  visibility?: string | null;
}): boolean {
  if (row.draft === true) return false;
  const st = row.status;
  if (st && st !== "published") return false;
  return String(row.visibility ?? "visible").trim().toLowerCase() === "visible";
}

/**
 * POST /api/reviews/verify
 * { draft_id, code } , validate OTP, insert published review (service role), cleanup draft + OTP.
 */
export async function POST(req: Request) {
  /** Set after draft load so outer catch can return product vs business duplicate text. */
  let verifyDraftProductPhotoId: string | null | undefined = undefined;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const supabaseAdmin = supabase;
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    const isGoogleUser = !!user;

    if (isGoogleUser) {
      return NextResponse.json({
        success: true,
        message: "Google user , no verification needed",
      });
    }

    const { draft_id, code } = (await req.json()) as VerifyBody;
    const draftId = typeof draft_id === "string" ? draft_id.trim() : "";
    const codeRaw = typeof code === "string" ? code.trim() : "";

    if (!isValidUuid(draftId) || !isSixDigitCode(codeRaw)) {
      return NextResponse.json(
        {
          error: "Enter the 6-digit code from your email.",
          error_code: "invalid_request",
        },
        { status: 400 },
      );
    }

    const { data: otpRows, error: otpListErr } = await supabase
      .from("review_otps")
      .select("*")
      .eq("draft_id", draftId)
      .order("created_at", { ascending: false });

    if (otpListErr) {
      console.error("review_otps select:", otpListErr);
      return NextResponse.json(
        {
          error: "Could not verify the code. Please try again.",
          error_code: "server_error",
        },
        { status: 500 },
      );
    }

    const list = otpRows ?? [];
    const matchingOtp = list.find(
      (row) => String(row.code).trim() === codeRaw,
    );

    if (!matchingOtp) {
      if (list.length === 0) {
        return NextResponse.json(
          {
            error:
              "No active verification code for this review. Tap Resend code or submit your review again.",
            error_code: "otp_missing",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        {
          error: "That code does not match the one we sent.",
          error_code: "wrong_code",
        },
        { status: 400 },
      );
    }

    const used =
      matchingOtp.used_at != null &&
      String(matchingOtp.used_at).trim().length > 0;
    if (used) {
      return NextResponse.json(
        {
          error: "This code was already used.",
          error_code: "otp_used",
        },
        { status: 400 },
      );
    }

    if (!otpNotExpired(matchingOtp)) {
      return NextResponse.json(
        {
          error: "That code has expired. Tap Resend code for a new one.",
          error_code: "otp_expired",
        },
        { status: 400 },
      );
    }

    const otpRow = matchingOtp;

    const { data: draft, error: draftErr } = await supabase
      .from("review_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();

    if (draftErr || !draft) {
      return NextResponse.json(
        {
          error: "Draft not found",
          error_code: "draft_not_found",
        },
        { status: 404 },
      );
    }

    const d = draft as ReviewDraftRow;
    const productPhotoIdForInsert = normalizeDraftProductPhotoId(d.product_photo_id);
    verifyDraftProductPhotoId = productPhotoIdForInsert;
    const suspendedVerify = await assertBusinessAcceptsPublicReviews(
      supabaseAdmin,
      d.business_id,
    );
    if (suspendedVerify) return suspendedVerify;

    const guestEmail = String(otpRow.email ?? "").trim().toLowerCase();
    if (!guestEmail.includes("@")) {
      return NextResponse.json(
        {
          error: "Invalid verification data.",
          error_code: "server_error",
        },
        { status: 500 },
      );
    }

    const domainCtxVerify = await fetchBusinessDomainContext(
      supabaseAdmin,
      d.business_id,
    );
    if (
      isReviewerBlockedAsBusinessDomain({
        reviewerEmailLower: guestEmail,
        businessDomains: domainCtxVerify.domains,
        businessContactEmailLower: domainCtxVerify.contactEmailLower,
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
    const guestNameResolved =
      (d.guest_name && String(d.guest_name).trim()) ||
      (guestEmail.includes("@") ? guestEmail.split("@")[0] : "") ||
      "Customer";

    let productReviewStatus: "published" | "under_review" = "published";
    if (productPhotoIdForInsert) {
      const rate = await evaluateProductReviewRateLimits(supabaseAdmin, {
        businessId: d.business_id,
        guestEmailLower: guestEmail,
        userId: d.user_id ?? null,
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
      productReviewStatus = rate.reviewStatus;
    }

    let publishedReviewId: string | null = null;
    try {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("reviews")
        .insert({
          business_id: d.business_id,
          rating: d.rating,
          title: d.title,
          body: d.body,
          guest_name: guestNameResolved.slice(0, 200),
          guest_email: guestEmail,
          date_of_experience: d.date_of_experience,
          status: productPhotoIdForInsert ? productReviewStatus : "published",
          visibility: "visible",
          verification_status: "verified",
          draft: false,
          imported: false,
          marketing_opt_in: Boolean(d.marketing_opt_in),
          invite_id: d.invite_id,
          receipt_url: d.receipt_url,
          reference_number: d.reference_number,
          user_id: d.user_id,
          is_flagged: false,
          ...(productPhotoIdForInsert ? { product_photo_id: productPhotoIdForInsert } : {}),
        })
        .select("id")
        .maybeSingle();
      if (insertErr) throw insertErr;
      publishedReviewId =
        inserted && typeof (inserted as { id?: string }).id === "string"
          ? (inserted as { id: string }).id
          : null;
      if (publishedReviewId) {
        await logReviewReceivedActivity({
          businessId: d.business_id,
          userId: d.user_id ?? null,
          reviewId: publishedReviewId,
          rating: d.rating,
        });
        if (d.invite_id) {
          void logInviteConvertedActivity({
            businessId: d.business_id,
            userId: d.user_id ?? null,
            inviteId: d.invite_id,
            reviewId: publishedReviewId,
          });
        }
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err.code === "23505") {
        const pgMsg = String(err.message ?? "");
        /** Row already exists (double-submit, retry, or race), complete verify and clean up draft. */
        if (productPhotoIdForInsert) {
          const { data: productDupes, error: productDupeErr } = await supabaseAdmin
            .from("reviews")
            .select("id, draft, status, visibility")
            .eq("business_id", d.business_id)
            .eq("guest_email", guestEmail)
            .eq("product_photo_id", productPhotoIdForInsert)
            .order("created_at", { ascending: false })
            .limit(8);
          if (productDupeErr) {
            console.error("[reviews/verify] idempotent product lookup", productDupeErr);
          } else {
            const live = (productDupes ?? []).find((r) => reviewRowIsPublicLive(r));
            if (live?.id) {
              await supabase.from("review_otps").delete().eq("draft_id", draftId);
              await supabase.from("review_drafts").delete().eq("id", draftId);
              return NextResponse.json({
                success: true,
                review_id: String(live.id),
              });
            }
          }
        } else {
          const { data: genDupes, error: genDupeErr } = await supabaseAdmin
            .from("reviews")
            .select("id, draft, status, visibility, product_photo_id")
            .eq("business_id", d.business_id)
            .eq("guest_email", guestEmail)
            .is("product_photo_id", null)
            .order("created_at", { ascending: false })
            .limit(8);
          if (genDupeErr) {
            console.error("[reviews/verify] idempotent general lookup", genDupeErr);
          } else {
            const live = (genDupes ?? []).find((r) => reviewRowIsPublicLive(r));
            if (live?.id) {
              await supabase.from("review_otps").delete().eq("draft_id", draftId);
              await supabase.from("review_drafts").delete().eq("id", draftId);
              return NextResponse.json({
                success: true,
                review_id: String(live.id),
              });
            }
          }
        }

        console.error("[reviews/verify] duplicate key, no idempotent row", {
          draftId,
          guestEmail,
          productPhotoIdForInsert,
          pg: pgMsg.slice(0, 500),
        });
        if (
          productPhotoIdForInsert &&
          pgMsg.toLowerCase().includes("reviews_guest_business_no_product")
        ) {
          console.error(
            "[reviews/verify] Product draft hit business-level unique, apply migrations (reviews partial indexes)",
            { draftId, productPhotoIdForInsert },
          );
        }

        const msg = duplicateReviewMessageFromPgError(pgMsg, productPhotoIdForInsert != null);
        return NextResponse.json(
          {
            error: msg,
            error_code: "duplicate_review",
          },
          { status: 400 },
        );
      }

      throw error;
    }

    if (d.invite_id) {
      await supabase
        .from("review_invites")
        .update({
          review_submitted_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", d.invite_id);
    }

    await supabase.from("review_otps").delete().eq("draft_id", draftId);
    await supabase.from("review_drafts").delete().eq("id", draftId);

    return NextResponse.json({
      success: true,
      review_id: publishedReviewId,
    });
  } catch (e: unknown) {
    console.error("VERIFY ERROR:", e);
    const err = e as { code?: string; message?: string };
    if (err.code === "23505") {
      const msg = duplicateReviewMessageFromPgError(
        String(err.message ?? ""),
        verifyDraftProductPhotoId != null && verifyDraftProductPhotoId !== undefined,
      );
      return NextResponse.json(
        {
          error: msg,
          error_code: "duplicate_review",
        },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        error: "Could not publish your review. Please try again in a moment.",
        error_code: "server_error",
      },
      { status: 500 },
    );
  }
}
