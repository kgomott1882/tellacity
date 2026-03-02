import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, message: "Method not allowed." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const rawBody = await req.text();
    if (!rawBody) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing request body." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: {
      business_id?: string;
      rating?: number;
      title?: string | null;
      body?: string;
      date_of_experience?: string;
      guest_email?: string;
      guest_name?: string;
      invite_token?: string | null;
    };
    try {
      parsed = JSON.parse(rawBody);
    } catch (_error) {
      return new Response(
        JSON.stringify({ ok: false, message: "Invalid JSON payload." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      business_id,
      rating,
      title,
      body,
      date_of_experience,
      guest_email,
      guest_name,
      invite_token,
    } = parsed;

    if (!business_id || rating == null || !body || !date_of_experience || !guest_email || !guest_name) {
      return new Response(
        JSON.stringify({ ok: false, message: "Missing required fields." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ ok: false, message: "Failed to create review draft." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const nowIso = new Date().toISOString();

    let inviteId: string | null = null;

    const submittedEmail = guest_email.trim().toLowerCase();

    if (invite_token && invite_token.trim()) {
      const trimmedToken = invite_token.trim();

      const { data: invite, error: inviteError } = await supabase
        .from("review_invites")
        .select("id, business_id, used_at, review_id, target_email, recipient_email")
        .eq("token", trimmedToken)
        .maybeSingle();

      if (inviteError) {
        return new Response(
          JSON.stringify({ ok: false, message: "Invalid invite." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!invite) {
        return new Response(
          JSON.stringify({ ok: false, message: "Invalid invite." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const inviteRow = invite as {
        id: string;
        business_id: string;
        used_at?: string | null;
        review_id?: string | null;
        target_email?: string | null;
        recipient_email?: string | null;
      };

      if (inviteRow.used_at != null || inviteRow.review_id != null) {
        return new Response(
          JSON.stringify({ ok: false, message: "Invite already used." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetEmailRaw =
        inviteRow.target_email != null ? inviteRow.target_email : inviteRow.recipient_email;
      const targetEmail =
        typeof targetEmailRaw === "string" ? targetEmailRaw.trim().toLowerCase() : null;

      if (!targetEmail || submittedEmail !== targetEmail) {
        return new Response(
          JSON.stringify({
            ok: false,
            message: "This invite is tied to a different email.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      inviteId = inviteRow.id;
    }

    try {
      const { data: inserted, error } = await supabase
        .from("reviews")
        .insert({
          business_id,
          rating: Math.max(1, Math.min(5, Math.round(rating))),
          title: title?.trim() || null,
          body: body.trim(),
          date_of_experience,
          guest_email: submittedEmail,
          guest_name: guest_name.trim(),
          draft: false,
          status: "published",
          invite_id: inviteId,
        })
        .select("id")
        .maybeSingle();

      if (error) {
        if (error.code === "23505") {
          const message = inviteId
            ? "This review link has already been used."
            : "You have already reviewed this business.";
          return new Response(
            JSON.stringify({
              ok: false,
              message,
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: false, message: "Failed to create review draft." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const reviewId =
        (inserted as { id?: string } | null)?.id != null
          ? (inserted as { id: string }).id
          : null;

      if (inviteId && reviewId) {
        await supabase
          .from("review_invites")
          .update({
            used_at: nowIso,
            review_id: reviewId,
          })
          .eq("id", inviteId);
      }

      return new Response(
        JSON.stringify({ ok: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (_err) {
      return new Response(
        JSON.stringify({ ok: false, message: "Failed to create review draft." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (_error) {
    return new Response(
      JSON.stringify({ ok: false, message: "Failed to create review draft." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
