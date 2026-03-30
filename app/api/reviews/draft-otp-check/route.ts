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
 * GET /api/reviews/draft-otp-check?draft_id=<uuid>
 * True only if review_drafts still exists and review_otps has a non-expired row for it.
 * Used so sessionStorage cannot show the OTP step with a draft_id deleted after a resubmit.
 */
export async function GET(req: Request) {
  try {
    const draftId = new URL(req.url).searchParams.get("draft_id")?.trim() ?? "";
    if (!isUuid(draftId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: draft, error: dErr } = await supabase
      .from("review_drafts")
      .select("id")
      .eq("id", draftId)
      .maybeSingle();

    if (dErr || !draft) {
      return NextResponse.json({ ok: false });
    }

    const { data: otpRows, error: oErr } = await supabase
      .from("review_otps")
      .select("id, expires_at")
      .eq("draft_id", draftId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (oErr || !otpRows?.length) {
      return NextResponse.json({ ok: false });
    }

    const otp = otpRows[0] as { expires_at?: string | null };

    const exp = otp.expires_at;
    if (exp != null && String(exp).length > 0) {
      const t = new Date(String(exp)).getTime();
      if (!Number.isNaN(t) && t < Date.now()) {
        return NextResponse.json({ ok: false });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("draft-otp-check:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
