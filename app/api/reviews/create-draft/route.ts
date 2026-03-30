export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";

type Body = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  invite_token?: string;
  guest_email?: string;
  guest_name?: string;
  receipt_url?: string | null;
  date_of_experience?: string | null;
  marketing_opt_in?: boolean;
  reference_number?: string | null;
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
 * Invite flow step 1: persist review_drafts + consumer_otps and email a 6-digit code.
 * Does not insert into reviews.
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
    const guest_name = (typeof body.guest_name === "string" ? body.guest_name.trim() : "") || "Customer";

    if (!isUuid(business_id) || !invite_token || !rawBody) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    const ratingNum = Number(body.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    if (!guest_email_raw || !guest_email_raw.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
    const authHeader = req.headers.get("authorization") ?? "";
    let userId: string | null = null;
    let authedEmail: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const bearer = authHeader.slice(7).trim();
      if (bearer && bearer !== anonKey) {
        const { data: userData, error: guErr } = await supabase.auth.getUser(bearer);
        if (!guErr && userData?.user) {
          userId = userData.user.id;
          authedEmail =
            userData.user.email?.trim().toLowerCase() ?? null;
        }
      }
    }

    const { data: inv, error: invErr } = await supabase
      .from("review_invites")
      .select("id, business_id, recipient_email, review_submitted_at, expires_at")
      .eq("token", invite_token)
      .maybeSingle();

    if (invErr || !inv) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    if (String(inv.business_id) !== business_id) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    const invEmail = String(inv.recipient_email ?? "").trim().toLowerCase();
    if (!invEmail || invEmail !== guest_email_raw) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
    }

    if (inv.review_submitted_at) {
      return NextResponse.json({ error: "This invite has already been used." }, { status: 400 });
    }

    if (inv.expires_at) {
      const exp = new Date(String(inv.expires_at));
      if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
        return NextResponse.json({ error: "Invite expired" }, { status: 400 });
      }
    }

    const inviteRowId = inv.id as string;

    if (userId) {
      if (!authedEmail || authedEmail !== invEmail) {
        return NextResponse.json(
          { error: "Sign in with the email that received the invitation." },
          { status: 403 },
        );
      }
    }

    const { data: existingByGuest } = await supabase
      .from("reviews")
      .select("id, status, draft, visibility")
      .eq("business_id", business_id)
      .eq("guest_email", invEmail)
      .limit(25);

    const { data: existingByUser } = userId
      ? await supabase
          .from("reviews")
          .select("id, status, draft, visibility")
          .eq("business_id", business_id)
          .eq("user_id", userId)
          .limit(25)
      : { data: null };

    const combined = [...(existingByGuest ?? []), ...(existingByUser ?? [])];
    const seen = new Set<string>();
    const unique = combined.filter((r) => {
      if (!r?.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    const live = unique.find((r) => rowIsPublicLiveReview(r));
    if (live) {
      return NextResponse.json(
        { error: "You already have a published review for this business." },
        { status: 409 },
      );
    }

    await supabase.from("review_drafts").delete().eq("invite_id", inviteRowId);

    const titleVal =
      typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

    const draftInsert = {
      business_id,
      rating: Math.round(ratingNum),
      title: titleVal,
      body: rawBody,
      invite_id: inviteRowId,
      email: invEmail,
    };

    const { data: draft, error: draftErr } = await supabase
      .from("review_drafts")
      .insert(draftInsert)
      .select("id")
      .single();

    if (draftErr || !draft?.id) {
      console.error("REVIEW DRAFT INSERT ERROR:", draftErr);
      return NextResponse.json(
        { error: draftErr?.message ?? "Could not save your review draft." },
        { status: 500 },
      );
    }

    const draftId = draft.id as string;

    await supabase.from("consumer_otps").delete().eq("draft_id", draftId);

    const code = String(Math.floor(100000 + Math.random() * 900000));

    const { error: otpErr } = await supabase.from("consumer_otps").insert({
      email: invEmail,
      code,
      type: "review_verification",
      draft_id: draftId,
    });

    if (otpErr) {
      console.error("consumer_otps insert error:", otpErr);
      await supabase.from("review_drafts").delete().eq("id", draftId);
      return NextResponse.json(
        { error: "Could not send verification code." },
        { status: 500 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      await supabase.from("consumer_otps").delete().eq("draft_id", draftId);
      await supabase.from("review_drafts").delete().eq("id", draftId);
      return NextResponse.json(
        { error: "Email is not configured. Please try again later." },
        { status: 503 },
      );
    }

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111827;">
  <p>Hi ${guest_name.replace(/</g, "&lt;")},</p>
  <p>Your Tellacity verification code is:</p>
  <h2 style="letter-spacing:4px">${code}</h2>
  <p>Enter this code to publish your review. It expires in 10 minutes.</p>
</body>
</html>
`.trim();

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const sendRes = await resend.emails.send({
        from: resendFromHeader(),
        to: invEmail,
        subject: "Verify your Tellacity review",
        html,
      });
      if (sendRes.error) {
        console.error("Resend error:", sendRes.error);
        await supabase.from("consumer_otps").delete().eq("draft_id", draftId);
        await supabase.from("review_drafts").delete().eq("id", draftId);
        return NextResponse.json(
          { error: "Could not send verification email." },
          { status: 500 },
        );
      }
    } catch (e) {
      console.error("Resend send failed:", e);
      await supabase.from("consumer_otps").delete().eq("draft_id", draftId);
      await supabase.from("review_drafts").delete().eq("id", draftId);
      return NextResponse.json(
        { error: "Could not send verification email." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      draft_id: draftId,
    });
  } catch (e) {
    console.error("/api/reviews/create-draft error:", e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
