/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Row is an unpublished OTP / in-progress review */
function rowIsDraft(row: {
  draft?: boolean | null;
}): boolean {
  return row.draft === true;
}

/**
 * A review that would count as “already on the business profile” for duplicate UX:
 * published workflow + visible (not moderated hidden).
 */
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

type DraftPayload = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  guest_name?: string;
  guest_email?: string;
  date_of_experience?: string | null;
  marketing_opt_in?: boolean | null;
  receipt_url?: string | null;
  reference_number?: string | null;
  invite_id?: string | null;
  /** When true with valid `invite_token`, publish without OTP (invite link flow). */
  is_invite?: boolean;
  invite_token?: string | null;
};

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase env", {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceKey,
      });
      return json({ error: "Missing Supabase env" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const anonKeyEnv = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    let authedUser: { id: string; email?: string | null } | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const bearer = authHeader.slice(7).trim();
      if (bearer && bearer !== anonKeyEnv && bearer !== serviceKey) {
        const { data: userData, error: authGetUserErr } = await supabase.auth
          .getUser(bearer);
        if (authGetUserErr) {
          console.error("create-review-draft auth.getUser error:", authGetUserErr);
        } else if (userData?.user) {
          authedUser = userData.user;
        }
      }
    }

    let payload: DraftPayload;
    try {
      payload = (await req.json()) as DraftPayload;
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // Basic payload validation
    if (!payload || typeof payload !== "object") {
      return json({ error: "Invalid payload" }, 400);
    }

    const business_id = (payload.business_id ?? "").trim();
    if (!isUuid(business_id)) {
      return json({ error: "business_id must be a valid UUID" }, 400);
    }

    const ratingNum = Number(payload.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return json({ error: "rating must be between 1 and 5" }, 400);
    }

    const body = (payload.body ?? "").trim();
    if (!body) {
      return json({ error: "body is required" }, 400);
    }

    const guest_name = (payload.guest_name ?? "").trim();
    if (!guest_name) {
      return json({ error: "guest_name is required" }, 400);
    }

    const guest_email = (payload.guest_email ?? "").trim().toLowerCase();
    if (!guest_email || !guest_email.includes("@")) {
      return json({ error: "guest_email must be a valid email" }, 400);
    }

    let date_of_experience: string | null = null;
    if (payload.date_of_experience && payload.date_of_experience.trim()) {
      const d = payload.date_of_experience.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return json({ error: "date_of_experience must be YYYY-MM-DD" }, 400);
      }
      const parsed = new Date(d);
      if (Number.isNaN(parsed.getTime())) {
        return json({ error: "date_of_experience is invalid" }, 400);
      }
      date_of_experience = d;
    }

    const marketing_opt_in = payload.marketing_opt_in ?? false;
    const receipt_url =
      payload.receipt_url && payload.receipt_url.trim()
        ? payload.receipt_url.trim()
        : null;
    const reference_number =
      payload.reference_number && payload.reference_number.trim()
        ? payload.reference_number.trim()
        : null;

    const is_invite = Boolean(payload.is_invite);
    const invite_token_raw =
      typeof payload.invite_token === "string" ? payload.invite_token.trim() : "";

    // ── Invite link: publish immediately (no OTP) ───────────────────────────
    if (is_invite) {
      if (!invite_token_raw) {
        return json({ error: "invite_token_required" }, 400);
      }

      const { data: inv, error: invErr } = await supabase
        .from("review_invites")
        .select(
          "id, business_id, recipient_email, review_submitted_at, expires_at",
        )
        .eq("token", invite_token_raw)
        .maybeSingle();

      if (invErr || !inv) {
        return json({ error: "invalid_invite" }, 400);
      }

      if (inv.business_id !== business_id) {
        return json({ error: "invalid_invite" }, 400);
      }

      const invEmail = String(inv.recipient_email ?? "").trim().toLowerCase();
      if (!invEmail) {
        return json({ error: "invalid_invite" }, 400);
      }
      if (authedUser) {
        const uEmail = String(authedUser.email ?? "").trim().toLowerCase();
        if (!uEmail || uEmail !== invEmail) {
          return json({ error: "invalid_invite" }, 400);
        }
      } else if (invEmail !== guest_email) {
        return json({ error: "invalid_invite" }, 400);
      }

      if (inv.review_submitted_at) {
        return json({ error: "invite_used" }, 400);
      }

      if (inv.expires_at) {
        const exp = new Date(String(inv.expires_at));
        if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
          return json({ error: "invite_expired" }, 400);
        }
      }

      const inviteRowId = (inv as { id: string }).id;

      const userIdForReview: string | null = authedUser ? authedUser.id : null;
      const guestEmailForReview: string | null = authedUser ? null : guest_email;

      const titleVal =
        payload.title && payload.title.trim()
          ? payload.title.trim()
          : null;

      const publishedUpdateRow: Record<string, unknown> = {
        rating: ratingNum,
        title: titleVal,
        body,
        guest_name,
        user_id: userIdForReview,
        guest_email: guestEmailForReview,
        date_of_experience,
        marketing_opt_in,
        receipt_url,
        reference_number,
        status: "published",
        draft: false,
        visibility: "visible",
        invite_id: inviteRowId,
        updated_at: new Date().toISOString(),
      };
      if (!userIdForReview) {
        publishedUpdateRow.source = "guest";
      }

      const publishedInsertRow: Record<string, unknown> = {
        business_id,
        rating: ratingNum,
        title: titleVal,
        body,
        guest_name,
        user_id: userIdForReview,
        guest_email: guestEmailForReview,
        date_of_experience,
        marketing_opt_in,
        receipt_url,
        reference_number,
        status: "published",
        draft: false,
        visibility: "visible",
        invite_id: inviteRowId,
      };
      if (!userIdForReview) {
        publishedInsertRow.source = "guest";
      }

      const markInviteSubmitted = async (): Promise<boolean> => {
        const ts = new Date().toISOString();
        const { error: invUpErr } = await supabase
          .from("review_invites")
          .update({
            review_submitted_at: ts,
            status: "completed",
          })
          .eq("id", inviteRowId);
        if (invUpErr) {
          console.error("REVIEW INVITE UPDATE ERROR:", invUpErr);
          return false;
        }
        return true;
      };

      type ListRow = {
        id: string;
        status?: string | null;
        draft?: boolean | null;
        visibility?: string | null;
        created_at?: string | null;
      };

      let list: ListRow[] = [];
      if (authedUser) {
        const [uRes, gRes] = await Promise.all([
          supabase
            .from("reviews")
            .select("id, status, draft, visibility, created_at")
            .eq("business_id", business_id)
            .eq("user_id", authedUser.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("reviews")
            .select("id, status, draft, visibility, created_at")
            .eq("business_id", business_id)
            .eq("guest_email", invEmail)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);
        const existingInviteError = uRes.error ?? gRes.error;
        if (existingInviteError) {
          console.error(
            "Invite flow existing review lookup failed:",
            existingInviteError,
          );
          return json({ error: "unexpected_error" }, 500);
        }
        const map = new Map<string, ListRow>();
        for (const r of [...(uRes.data ?? []), ...(gRes.data ?? [])]) {
          if (r?.id) map.set(r.id, r as ListRow);
        }
        list = [...map.values()].sort(
          (a, b) =>
            new Date(String(b.created_at ?? 0)).getTime() -
            new Date(String(a.created_at ?? 0)).getTime(),
        );
      } else {
        const { data: existingRows, error: existingInviteError } = await supabase
          .from("reviews")
          .select("id, status, draft, visibility, created_at")
          .eq("business_id", business_id)
          .eq("guest_email", guest_email)
          .order("created_at", { ascending: false })
          .limit(20);

        if (existingInviteError) {
          console.error(
            "Invite flow existing review lookup failed:",
            existingInviteError,
          );
          return json({ error: "unexpected_error" }, 500);
        }
        list = (existingRows ?? []) as ListRow[];
      }

      const draftRow = list.find((r) => rowIsDraft(r));
      if (draftRow?.id) {
        const { error: upErr } = await supabase
          .from("reviews")
          .update(publishedUpdateRow)
          .eq("id", draftRow.id);

        if (upErr) {
          console.error("Invite flow publish draft error:", upErr);
          return json({ error: "unexpected_error" }, 500);
        }

        if (!(await markInviteSubmitted())) {
          return json({ error: "unexpected_error" }, 500);
        }

        return json(
          {
            published: true,
            requiresOtp: false,
            reviewId: draftRow.id,
          },
          200,
        );
      }

      const liveRow = list.find((r) => rowIsPublicLiveReview(r));
      if (liveRow?.id) {
        return json(
          {
            requiresUpdate: true,
            reviewId: liveRow.id,
          },
          200,
        );
      }

      // Hidden / non-live rows still tied to this email: republish in place so the invite
      // succeeds (business page may show 0 visible reviews while a hidden row existed).
      const salvageRow = list[0];
      if (salvageRow?.id) {
        const { error: upSalvage } = await supabase
          .from("reviews")
          .update(publishedUpdateRow)
          .eq("id", salvageRow.id);

        if (upSalvage) {
          console.error("Invite flow salvage publish error:", upSalvage);
          return json({ error: "unexpected_error" }, 500);
        }

        if (!(await markInviteSubmitted())) {
          return json({ error: "unexpected_error" }, 500);
        }

        return json(
          {
            published: true,
            requiresOtp: false,
            reviewId: salvageRow.id,
          },
          200,
        );
      }

      const { data: publishedRow, error: pubErr } = await supabase
        .from("reviews")
        .insert(publishedInsertRow)
        .select("id,business_id")
        .single();

      if (pubErr) {
        console.error("REVIEW INSERT ERROR:", pubErr);
        const anyErr = pubErr as { code?: string; message?: string };
        if (anyErr?.code === "23505") {
          return json({ error: "duplicate_review" }, 409);
        }
        return json(
          { error: anyErr.message ?? "unexpected_error" },
          500,
        );
      }

      if (!publishedRow?.id) {
        return json({ error: "unexpected_error" }, 500);
      }

      if (!(await markInviteSubmitted())) {
        return json({ error: "unexpected_error" }, 500);
      }

      return json(
        {
          published: true,
          requiresOtp: false,
          reviewId: publishedRow.id,
        },
        200,
      );
    }

    const invite_idRaw =
      payload.invite_id && payload.invite_id.trim()
        ? payload.invite_id.trim()
        : null;
    const invite_id =
      invite_idRaw && isUuid(invite_idRaw) ? invite_idRaw : null;

    // Check for an existing review for this business + guest email
    const { data: guestRows, error: existingError } = await supabase
      .from("reviews")
      .select("id, status, draft, visibility, created_at")
      .eq("business_id", business_id)
      .eq("guest_email", guest_email)
      .order("created_at", { ascending: false })
      .limit(20);

    if (existingError) {
      console.error("Existing review lookup failed:", existingError);
      return json({ error: "unexpected_error" }, 500);
    }

    const guestList = guestRows ?? [];

    const guestDraft = guestList.find((r) => rowIsDraft(r));
    if (guestDraft?.id) {
      return json(
        {
          error: "draft_exists",
          reviewId: guestDraft.id,
        },
        409,
      );
    }

    const guestLive = guestList.find((r) => rowIsPublicLiveReview(r));
    if (guestLive?.id) {
      return json(
        {
          requiresUpdate: true,
          reviewId: guestLive.id,
        },
        200,
      );
    }

    const insertRow: Record<string, unknown> = {
      business_id,
      rating: ratingNum,
      title:
        payload.title && payload.title.trim()
          ? payload.title.trim()
          : null,
      body,
      guest_name,
      guest_email,
      date_of_experience,
      marketing_opt_in,
      receipt_url,
      reference_number,
      source: "guest",
      status: "draft",
      draft: true,
    };

    if (invite_id) {
      insertRow.invite_id = invite_id;
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertRow)
      .select("id,business_id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      const anyErr = error as { code?: string; message?: string };

      if (anyErr?.code === "23505") {
        return json(
          { error: "duplicate_review" },
          409,
        );
      }

      // expose actual DB error for debugging
      return json(
        {
          error: "unexpected_error",
        },
        500,
      );
    }

    // After creating the draft review, generate and send a verification OTP
    let otpRowId: string | null = null;
    try {
      const otp = generateOtp();

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { data: otpRow, error: otpError } = await supabase
        .from("review_email_otps")
        .insert({
          email: guest_email,
          code: otp,
          review_id: data.id,
          attempts: 0,
          used: false,
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (otpError || !otpRow?.id) {
        console.error("Failed to insert review_email_otps row:", otpError);
        return json(
          { error: "unexpected_error" },
          500,
        );
      }

      otpRowId = otpRow.id;

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY is not set");
        await supabase.from("review_email_otps").delete().eq("id", otpRowId);
        return json(
          { error: "unexpected_error" },
          500,
        );
      }

      const resendFrom = Deno.env.get("RESEND_FROM_EMAIL")?.trim() ||
        "Tellacity <notifications@tellacity.com>";

      const subject = "Verify your Tellacity review";
      const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111827;">
  <p>Hi ${guest_name},</p>

  <p>Your Tellacity verification code is:</p>

  <h2 style="letter-spacing:4px">${otp}</h2>

  <p>Enter this code in the verification window to publish your review.</p>

  <p>This code expires in 10 minutes.</p>
</body>
</html>
`.trim();

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: guest_email,
          subject,
          html,
        }),
      });

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        console.error(
          "Resend OTP email error:",
          emailResponse.status,
          errorBody,
        );
        await supabase.from("review_email_otps").delete().eq("id", otpRowId);
        return json(
          { error: "unexpected_error" },
          500,
        );
      }
    } catch (err) {
      console.error("OTP generation/email error:", err);
      if (otpRowId) {
        await supabase.from("review_email_otps").delete().eq("id", otpRowId);
      }
      return json(
        { error: "unexpected_error" },
        500,
      );
    }

    return json(
      {
        requiresOtp: true,
        reviewId: data.id,
      },
      200,
    );
  } catch (err: any) {
    console.error("create-review-draft failed:", err);

    return json(
      {
        error: "unexpected_error",
      },
      500,
    );
  }
});

