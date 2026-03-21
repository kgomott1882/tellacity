export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";

function isValidUuid(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isSixDigitCode(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9]{6}$/.test(value);
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function resendFromHeader(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  return from && from.length > 0
    ? from
    : "Tellacity <notifications@tellacity.com>";
}

/** Maps PostgREST / Postgres errors from helpful OTP insert to a stable client error code. */
function helpfulOtpInsertErrorKey(err: {
  code?: string;
  message?: string;
} | null): string {
  if (!err) return "otp_failed";
  const code = String(err.code ?? "");
  const msg = String(err.message ?? "").toLowerCase();
  if (
    code === "42P01" ||
    msg.includes("does not exist") ||
    (msg.includes("relation") && msg.includes("review_helpful_otps")) ||
    msg.includes("schema cache")
  ) {
    return "helpful_db_missing";
  }
  if (
    code === "42501" ||
    msg.includes("row-level security") ||
    msg.includes("violates row-level security") ||
    (msg.includes("permission denied") &&
      (msg.includes("review_helpful_otps") || msg.includes("review_helpful_votes")))
  ) {
    return "helpful_db_permission";
  }
  return "otp_failed";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertPublishedReview(supabase: any, reviewId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("id", reviewId)
    .maybeSingle();

  if (error || !data) return false;
  const s = (data as { status?: string | null }).status;
  return s === null || s === "published";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchLikeCount(supabase: any, reviewId: string): Promise<number> {
  const { data } = await supabase
    .from("reviews")
    .select("like_count")
    .eq("id", reviewId)
    .maybeSingle();
  return Number((data as { like_count?: number } | null)?.like_count ?? 0);
}

const HELPFUL_REVIEW_ID_IN_CHUNK = 150;

/** True if this guest email already has a helpful vote on any review for the same business. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function guestHasHelpfulForBusiness(
  supabase: any,
  reviewId: string,
  guestEmail: string,
): Promise<boolean> {
  const { data: target, error: e1 } = await supabase
    .from("reviews")
    .select("business_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (e1 || !(target as { business_id?: string } | null)?.business_id) {
    return false;
  }
  const businessId = (target as { business_id: string }).business_id;

  const { data: idRows, error: e2 } = await supabase
    .from("reviews")
    .select("id")
    .eq("business_id", businessId);
  if (e2 || !idRows?.length) return false;

  const ids = (idRows as { id: string }[]).map((r) => r.id);
  for (let i = 0; i < ids.length; i += HELPFUL_REVIEW_ID_IN_CHUNK) {
    const slice = ids.slice(i, i + HELPFUL_REVIEW_ID_IN_CHUNK);
    const { data: found } = await supabase
      .from("review_helpful_votes")
      .select("id")
      .eq("guest_email", guestEmail)
      .in("review_id", slice)
      .limit(1);
    if (found?.length) return true;
  }
  return false;
}

/** True if this user already has a helpful vote on any review for the same business. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function userHasHelpfulForBusiness(
  supabase: any,
  reviewId: string,
  userId: string,
): Promise<boolean> {
  const { data: target, error: e1 } = await supabase
    .from("reviews")
    .select("business_id")
    .eq("id", reviewId)
    .maybeSingle();
  if (e1 || !(target as { business_id?: string } | null)?.business_id) {
    return false;
  }
  const businessId = (target as { business_id: string }).business_id;

  const { data: idRows, error: e2 } = await supabase
    .from("reviews")
    .select("id")
    .eq("business_id", businessId);
  if (e2 || !idRows?.length) return false;

  const ids = (idRows as { id: string }[]).map((r) => r.id);
  for (let i = 0; i < ids.length; i += HELPFUL_REVIEW_ID_IN_CHUNK) {
    const slice = ids.slice(i, i + HELPFUL_REVIEW_ID_IN_CHUNK);
    const { data: found } = await supabase
      .from("review_helpful_votes")
      .select("id")
      .eq("user_id", userId)
      .in("review_id", slice)
      .limit(1);
    if (found?.length) return true;
  }
  return false;
}

type Body = {
  action?: string;
  reviewId?: string;
  guestName?: string;
  guestEmail?: string;
  code?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const reviewId = url.searchParams.get("reviewId")?.trim() ?? "";
    if (!isValidUuid(reviewId)) {
      return NextResponse.json({ error: "invalid_review" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!(await assertPublishedReview(supabase, reviewId))) {
      return NextResponse.json({ error: "review_not_found" }, { status: 404 });
    }

    const likeCount = await fetchLikeCount(supabase, reviewId);
    let hasVoted = false;

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (token) {
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (anon) {
        const authClient = createClient(supabaseUrl, anon, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: userData } = await authClient.auth.getUser();
        const uid = userData.user?.id;
        if (uid) {
          const { data: rows } = await supabase
            .from("review_helpful_votes")
            .select("id")
            .eq("review_id", reviewId)
            .eq("user_id", uid)
            .limit(1);
          hasVoted = !!rows?.length;
        }
      }
    }

    return NextResponse.json({ likeCount, hasVoted });
  } catch (e) {
    console.error("helpful GET:", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const reviewId =
      typeof body.reviewId === "string" ? body.reviewId.trim() : "";

    if (!isValidUuid(reviewId)) {
      return NextResponse.json({ error: "invalid_review" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (!(await assertPublishedReview(supabase, reviewId))) {
      return NextResponse.json({ error: "review_not_found" }, { status: 404 });
    }

    if (action === "vote_auth") {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : "";
      if (!token) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }

      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!anon) {
        return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
      }

      const authClient = createClient(supabaseUrl, anon, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userErr } = await authClient.auth.getUser();
      if (userErr || !userData.user?.id) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }

      const userId = userData.user.id;

      if (await userHasHelpfulForBusiness(supabase, reviewId, userId)) {
        const likeCount = await fetchLikeCount(supabase, reviewId);
        return NextResponse.json(
          { error: "already_liked_business", likeCount },
          { status: 409 },
        );
      }

      const { error: insErr } = await supabase.from("review_helpful_votes").insert({
        review_id: reviewId,
        user_id: userId,
        guest_email: null,
        guest_name: null,
      });

      if (insErr) {
        if (insErr.code === "23505") {
          const likeCount = await fetchLikeCount(supabase, reviewId);
          return NextResponse.json(
            { error: "already_liked_business", likeCount },
            { status: 409 },
          );
        }
        console.error("helpful vote_auth insert:", insErr);
        return NextResponse.json({ error: "vote_failed" }, { status: 500 });
      }

      const likeCount = await fetchLikeCount(supabase, reviewId);
      return NextResponse.json({ likeCount, hasVoted: true });
    }

    if (action === "request_otp") {
      const guestName =
        typeof body.guestName === "string" ? body.guestName.trim() : "";
      const guestEmail = normalizeEmail(
        typeof body.guestEmail === "string" ? body.guestEmail : ""
      );

      if (!guestName || guestName.length > 120) {
        return NextResponse.json({ error: "invalid_name" }, { status: 400 });
      }
      if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
        return NextResponse.json({ error: "invalid_email" }, { status: 400 });
      }

      if (await guestHasHelpfulForBusiness(supabase, reviewId, guestEmail)) {
        const likeCount = await fetchLikeCount(supabase, reviewId);
        return NextResponse.json(
          { error: "already_liked_business", likeCount },
          { status: 409 },
        );
      }

      await supabase
        .from("review_helpful_otps")
        .delete()
        .eq("review_id", reviewId)
        .eq("email", guestEmail)
        .eq("used", false);

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { data: otpRows, error: otpIns } = await supabase
        .from("review_helpful_otps")
        .insert({
          review_id: reviewId,
          email: guestEmail,
          guest_name: guestName,
          code,
          expires_at: expiresAt,
          attempts: 0,
          used: false,
        })
        .select("id");

      const otpRow = otpRows?.[0];
      if (otpIns || !otpRow?.id) {
        const clientKey = helpfulOtpInsertErrorKey(otpIns);
        console.error("helpful request_otp insert:", otpIns);
        if (clientKey === "helpful_db_missing") {
          console.error(
            "[helpful] Apply Supabase migration 20260321150000_review_helpful_votes.sql (then 20260321150100_review_helpful_table_grants.sql if needed).",
          );
        }
        if (clientKey === "helpful_db_permission") {
          console.error(
            "[helpful] Check SUPABASE_SERVICE_ROLE_KEY matches the same project as NEXT_PUBLIC_SUPABASE_URL.",
          );
        }
        return NextResponse.json(
          { error: clientKey },
          { status: clientKey === "helpful_db_missing" ? 503 : 500 },
        );
      }

      if (process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: resendFromHeader(),
            to: guestEmail,
            subject: "Your Tellacity verification code",
            html: `<p>Hi ${guestName.replace(/</g, "&lt;")},</p>
<p>Your verification code to mark a review as helpful is:</p>
<p style="font-size:24px;font-weight:bold;letter-spacing:0.2em;">${code}</p>
<p>This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>`,
          });
        } catch (mailErr) {
          console.error("helpful Resend:", mailErr);
          await supabase.from("review_helpful_otps").delete().eq("id", otpRow.id);
          return NextResponse.json({ error: "email_failed" }, { status: 500 });
        }
      } else {
        console.warn("RESEND_API_KEY missing; helpful OTP not emailed");
        await supabase.from("review_helpful_otps").delete().eq("id", otpRow.id);
        return NextResponse.json({ error: "email_unavailable" }, { status: 503 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "confirm_otp") {
      const guestEmail = normalizeEmail(
        typeof body.guestEmail === "string" ? body.guestEmail : ""
      );
      const code =
        typeof body.code === "string" ? body.code.trim().replace(/\s/g, "") : "";

      if (!guestEmail || !isSixDigitCode(code)) {
        return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
      }

      const { data: otpRows, error: otpErr } = await supabase
        .from("review_helpful_otps")
        .select("*")
        .eq("review_id", reviewId)
        .eq("email", guestEmail)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (otpErr || !otpRows?.[0]) {
        return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
      }

      const otp = otpRows[0] as {
        id: string;
        code: string;
        expires_at: string;
        attempts: number | null;
        guest_name: string;
      };

      if (otp.expires_at && new Date(otp.expires_at) < new Date()) {
        return NextResponse.json({ error: "otp_expired" }, { status: 400 });
      }

      if ((otp.attempts ?? 0) >= 5) {
        return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
      }

      if (otp.code !== code) {
        await supabase
          .from("review_helpful_otps")
          .update({ attempts: (otp.attempts ?? 0) + 1 })
          .eq("id", otp.id);
        return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
      }

      if (await guestHasHelpfulForBusiness(supabase, reviewId, guestEmail)) {
        await supabase.from("review_helpful_otps").update({ used: true }).eq("id", otp.id);
        const likeCount = await fetchLikeCount(supabase, reviewId);
        return NextResponse.json(
          { error: "already_liked_business", likeCount },
          { status: 409 },
        );
      }

      const { error: voteErr } = await supabase.from("review_helpful_votes").insert({
        review_id: reviewId,
        user_id: null,
        guest_email: guestEmail,
        guest_name: otp.guest_name,
      });

      if (voteErr) {
        if (voteErr.code === "23505") {
          await supabase.from("review_helpful_otps").update({ used: true }).eq("id", otp.id);
          const likeCount = await fetchLikeCount(supabase, reviewId);
          return NextResponse.json(
            { error: "already_liked_business", likeCount },
            { status: 409 },
          );
        }
        console.error("helpful confirm vote insert:", voteErr);
        return NextResponse.json({ error: "vote_failed" }, { status: 500 });
      }

      await supabase.from("review_helpful_otps").update({ used: true }).eq("id", otp.id);

      const likeCount = await fetchLikeCount(supabase, reviewId);
      return NextResponse.json({ likeCount, hasVoted: true });
    }

    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (e) {
    console.error("helpful POST:", e);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}
