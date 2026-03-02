import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const DEFAULTS = {
  send_delay_days: 1,
  reminder_enabled: false,
  reminder_delay_days: 3,
  custom_subject: "",
  custom_message: "",
  custom_signature: "",
  legal_footer_enabled: false,
};

function makeSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars.");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function resolveUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { user: null, supabase: null };
  const token = authHeader.replace("Bearer ", "").trim();
  const supabase = makeSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

async function getOwnedBusiness(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string };
}

export async function GET(req: Request) {
  try {
    const { user, supabase } = await resolveUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const business = await getOwnedBusiness(supabase, user.id);
    if (!business) {
      return NextResponse.json({ error: "No business found for this account." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("business_invite_settings")
      .select(
        "send_delay_days, reminder_enabled, reminder_delay_days, custom_subject, custom_message, custom_signature, legal_footer_enabled"
      )
      .eq("business_id", business.id)
      .maybeSingle();

    if (error) {
      console.error("[invite-settings GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return stored row or defaults if no row exists yet
    const settings = data
      ? {
          send_delay_days:      data.send_delay_days      ?? DEFAULTS.send_delay_days,
          reminder_enabled:     data.reminder_enabled     ?? DEFAULTS.reminder_enabled,
          reminder_delay_days:  data.reminder_delay_days  ?? DEFAULTS.reminder_delay_days,
          custom_subject:       data.custom_subject       ?? DEFAULTS.custom_subject,
          custom_message:       data.custom_message       ?? DEFAULTS.custom_message,
          custom_signature:     data.custom_signature     ?? DEFAULTS.custom_signature,
          legal_footer_enabled: data.legal_footer_enabled ?? DEFAULTS.legal_footer_enabled,
        }
      : DEFAULTS;

    return NextResponse.json(settings);
  } catch (err: any) {
    console.error("[invite-settings GET] unhandled:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, supabase } = await resolveUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const business = await getOwnedBusiness(supabase, user.id);
    if (!business) {
      return NextResponse.json({ error: "No business found for this account." }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const payload = {
      business_id:          business.id,
      send_delay_days:      typeof body.send_delay_days === "number"  ? body.send_delay_days      : DEFAULTS.send_delay_days,
      reminder_enabled:     typeof body.reminder_enabled === "boolean" ? body.reminder_enabled    : DEFAULTS.reminder_enabled,
      reminder_delay_days:  typeof body.reminder_delay_days === "number" ? body.reminder_delay_days : DEFAULTS.reminder_delay_days,
      custom_subject:       typeof body.custom_subject === "string"   ? body.custom_subject       : DEFAULTS.custom_subject,
      custom_message:       typeof body.custom_message === "string"   ? body.custom_message       : DEFAULTS.custom_message,
      custom_signature:     typeof body.custom_signature === "string" ? body.custom_signature     : DEFAULTS.custom_signature,
      legal_footer_enabled: typeof body.legal_footer_enabled === "boolean" ? body.legal_footer_enabled : DEFAULTS.legal_footer_enabled,
      updated_at:           new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("business_invite_settings")
      .upsert(payload, { onConflict: "business_id" })
      .select(
        "send_delay_days, reminder_enabled, reminder_delay_days, custom_subject, custom_message, custom_signature, legal_footer_enabled"
      )
      .single();

    if (error) {
      console.error("[invite-settings POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (err: any) {
    console.error("[invite-settings POST] unhandled:", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
