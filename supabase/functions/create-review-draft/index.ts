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

    try {
      const { error } = await supabase.from("reviews").insert({
        business_id,
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        title: title?.trim() || null,
        body: body.trim(),
        date_of_experience,
        guest_email: guest_email.trim().toLowerCase(),
        guest_name: guest_name.trim(),
        draft: false,
        status: "published",
      });

      if (error) {
        if (error.code === "23505") {
          return new Response(
            JSON.stringify({
              ok: false,
              message: "You have already reviewed this business.",
            }),
            { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ ok: false, message: "Failed to create review draft." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
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
