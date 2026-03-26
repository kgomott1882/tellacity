export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export async function GET() {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("review_invite_email_templates")
      .select("*");

    if (error) {
      console.error("[review-invite-email-templates] query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error("[review-invite-email-templates] unhandled error:", error);
    return NextResponse.json(
      { error: "Failed to load review invite email templates." },
      { status: 500 }
    );
  }
}
