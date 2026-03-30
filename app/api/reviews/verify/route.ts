export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type VerifyBody = {
  draft_id?: string;
  code?: string;
};

function isValidUuid(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isSixDigitCode(value: string | undefined | null): value is string {
  if (!value) return false;
  return /^[0-9]{6}$/.test(value.trim());
}

type RpcRow = {
  success: boolean;
  reason: string | null;
  business_id: string | null;
};

/**
 * POST /api/reviews/verify
 * Public guest flow: { draft_id, code } — SECURITY DEFINER RPC validates review_otps
 * and publishes from review_drafts. Anon client only; no auth session or service role.
 */
export async function POST(req: Request) {
  try {
    const { draft_id, code } = (await req.json()) as VerifyBody;
    const draftId =
      typeof draft_id === "string" ? draft_id.trim() : "";
    const codeRaw = typeof code === "string" ? code.trim() : "";

    if (!isValidUuid(draftId) || !isSixDigitCode(codeRaw)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!supabaseUrl || !anonKey) {
      console.error("VERIFY: missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: rpcData, error: rpcErr } = await supabase.rpc(
      "verify_review_token",
      { p_token: draftId, p_code: codeRaw },
    );

    if (rpcErr) {
      console.error("verify_review_token RPC:", rpcErr);
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const rows = (rpcData ?? []) as RpcRow[];
    const row = rows[0];
    if (!row || row.success !== true) {
      const reason = row?.reason ?? "";
      if (reason === "invalid_code" || reason === "expired") {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("VERIFY ERROR:", e);
    const message =
      e && typeof e === "object" && "message" in e
        ? String((e as { message?: unknown }).message)
        : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
