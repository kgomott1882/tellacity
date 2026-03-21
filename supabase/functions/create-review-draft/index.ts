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
      // Simple YYYY-MM-DD validation
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

    const invite_idRaw =
      payload.invite_id && payload.invite_id.trim()
        ? payload.invite_id.trim()
        : null;
    const invite_id =
      invite_idRaw && isUuid(invite_idRaw) ? invite_idRaw : null;

    // Check for an existing review for this business + guest email
    const { data: existing, error: existingError } = await supabase
      .from("reviews")
      .select("id, status, draft")
      .eq("business_id", business_id)
      .eq("guest_email", guest_email)
      .maybeSingle();

    if (existingError) {
      console.error("Existing review lookup failed:", existingError);
      return json({ error: "unexpected_error" }, 500);
    }

    if (existing?.id && (existing as any).draft === true) {
      return json(
        {
          error: "draft_exists",
          reviewId: (existing as { id: string }).id,
        },
        409,
      );
    }

    if (existing?.id) {
      return json(
        {
          requiresUpdate: true,
          reviewId: (existing as { id: string }).id,
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
<head><meta charset="utf-8" /></head>
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

