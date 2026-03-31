export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * GET /api/reviews/find-draft?invite_id=<uuid>
 * Returns existing review_drafts.id for this invite (invite flow reuse).
 */
export async function GET(req: Request) {
  try {
    const inviteId =
      new URL(req.url).searchParams.get("invite_id")?.trim() ?? "";
    if (!isUuid(inviteId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase
      .from("review_drafts")
      .select("id")
      .eq("invite_id", inviteId)
      .maybeSingle();

    if (error) {
      console.error("find-draft:", error);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    const id = data && typeof data === "object" && "id" in data
      ? String((data as { id: string }).id ?? "").trim()
      : "";
    if (id && isUuid(id)) {
      return NextResponse.json({ draft_id: id });
    }

    return NextResponse.json({});
  } catch (e) {
    console.error("find-draft:", e);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
