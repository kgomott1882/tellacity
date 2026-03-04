/// <reference deno.ns="deno" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type DraftPayload = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  guest_name?: string;
  guest_email?: string;
  date_of_experience?: string; // yyyy-mm-dd
  marketing_opt_in?: boolean | null;
  proof_urls?: string[] | null;
  proof_data?: unknown | null;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v,
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const SUPABASE_URL =
      Deno.env.get("SUPABASE_URL") ?? Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const SERVICE_ROLE =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SERVICE_ROLE");

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      console.error("Missing Supabase env vars", {
        hasUrl: !!SUPABASE_URL,
        hasServiceRole: !!SERVICE_ROLE,
      });
      return json(500, {
        error:
          "Server misconfigured: missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets.",
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const payload = (await req.json()) as DraftPayload;

    const business_id = (payload.business_id ?? "").trim();
    const body = (payload.body ?? "").trim();
    const guest_name = (payload.guest_name ?? "").trim();
    const guest_email = (payload.guest_email ?? "").trim().toLowerCase();
    const rating = Number(payload.rating);

    // Required fields
    if (!business_id || !isUuid(business_id)) {
      return json(400, {
        error: "business_id is required and must be a UUID",
      });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return json(400, { error: "rating must be between 1 and 5" });
    }
    if (!body || body.length < 10) {
      return json(400, {
        error: "body is required (min 10 characters)",
      });
    }
    if (!guest_name) {
      return json(400, { error: "guest_name is required" });
    }
    if (!guest_email || !guest_email.includes("@")) {
      return json(400, { error: "guest_email is required" });
    }
    if (!payload.date_of_experience) {
      return json(400, {
        error: "date_of_experience is required",
      });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const insertRow = {
      business_id,
      rating,
      title: payload.title?.trim() || null,
      body,
      guest_name,
      guest_email,
      date_of_experience: payload.date_of_experience,
      marketing_opt_in: payload.marketing_opt_in ?? false,

      // Draft mechanics
      status: "draft",
      draft: true,
      draft_token: token,
      draft_token_expires_at: expiresAt,
      verification_status: "pending",

      // Optional evidence/proof fields (if your schema supports them)
      proof_urls: payload.proof_urls ?? null,
      proof_data: payload.proof_data ?? null,

      source: "guest",
    };

    const { data, error } = await supabase
      .from("reviews")
      .insert(insertRow)
      .select(
        "id,business_id,draft_token,draft_token_expires_at,guest_email,status,draft",
      )
      .single();

    if (error) {
      // Clean handling of duplicate review per business/email
      // Postgres unique violation code
      // deno-lint-ignore no-explicit-any
      const code = (error as any)?.code;
      if (code === "23505") {
        return json(409, {
          error: "You have already reviewed this business.",
        });
      }

      console.error("create-review-draft insert error", error);
      return json(500, { error: "Failed to create review draft" });
    }

    return json(200, { ok: true, review: data });
  } catch (e) {
    console.error("create-review-draft unexpected error", e);
    return json(500, { error: "Failed to create review draft" });
  }
});

