export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

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

type ReviewDraftRow = {
  id: string;
  business_id: string;
  rating: number;
  title: string | null;
  body: string;
  email: string;
  guest_name: string | null;
  invite_id: string | null;
  date_of_experience: string | null;
  marketing_opt_in: boolean | null;
  receipt_url: string | null;
  reference_number: string | null;
  user_id: string | null;
};

type OtpRow = {
  id: string;
  draft_id: string;
  code: string;
  email: string;
  created_at: string;
  expires_at: string | null;
  used_at?: string | null;
};

function otpNotExpired(row: OtpRow): boolean {
  const deadline = row.expires_at
    ? new Date(String(row.expires_at)).getTime()
    : new Date(row.created_at).getTime() + 10 * 60 * 1000;
  if (Number.isNaN(deadline)) return false;
  return deadline >= Date.now();
}

function codesMatch(stored: unknown, input: string): boolean {
  return String(stored ?? "").trim() === input.trim();
}

/**
 * POST /api/reviews/verify
 * { draft_id, code } — validate OTP, insert published review (service role), cleanup draft + OTP.
 */
export async function POST(req: Request) {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const supabaseAdmin = supabase;
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    const isGoogleUser = !!user;

    if (isGoogleUser) {
      return NextResponse.json({
        success: true,
        message: "Google user — no verification needed",
      });
    }

    const { draft_id, code } = (await req.json()) as VerifyBody;
    const draftId = typeof draft_id === "string" ? draft_id.trim() : "";
    const codeRaw = typeof code === "string" ? code.trim() : "";

    if (!isValidUuid(draftId) || !isSixDigitCode(codeRaw)) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    const { data: otpRows, error: otpListErr } = await supabase
      .from("review_otps")
      .select("*")
      .eq("draft_id", draftId)
      .order("created_at", { ascending: false });

    if (otpListErr) {
      console.error("review_otps select:", otpListErr);
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    const otpRow = (otpRows ?? []).find((r) => {
      const row = r as OtpRow & { used_at?: string | null };
      const used =
        row.used_at != null && String(row.used_at).trim().length > 0;
      return (
        codesMatch(row.code, codeRaw) &&
        otpNotExpired(row) &&
        !used
      );
    }) as OtpRow | undefined;

    if (!otpRow) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    const { data: draft, error: draftErr } = await supabase
      .from("review_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();

    if (draftErr || !draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const d = draft as ReviewDraftRow;
    const guestEmail = String(d.email ?? "").trim().toLowerCase();
    if (!guestEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid draft email" }, { status: 400 });
    }
    if (String(otpRow.email ?? "").trim().toLowerCase() !== guestEmail) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }
    const guestNameResolved =
      (d.guest_name && String(d.guest_name).trim()) ||
      (guestEmail.includes("@") ? guestEmail.split("@")[0] : "") ||
      "Customer";

    try {
      const { error: insertErr } = await supabaseAdmin.from("reviews").insert({
        business_id: d.business_id,
        rating: d.rating,
        title: d.title,
        body: d.body,
        guest_name: guestNameResolved.slice(0, 200),
        guest_email: guestEmail,
        date_of_experience: d.date_of_experience,
        status: "published",
        visibility: "visible",
        verification_status: "verified",
        draft: false,
        imported: false,
        marketing_opt_in: Boolean(d.marketing_opt_in),
        invite_id: d.invite_id,
        receipt_url: d.receipt_url,
        reference_number: d.reference_number,
        user_id: d.user_id,
        is_flagged: false,
      });
      if (insertErr) throw insertErr;
    } catch (error: any) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({
            error: "You have already reviewed this business.",
          }),
          { status: 400 },
        );
      }

      throw error;
    }

    if (d.invite_id) {
      await supabase
        .from("review_invites")
        .update({
          review_submitted_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", d.invite_id);
    }

    await supabase.from("review_otps").delete().eq("draft_id", draftId);
    await supabase.from("review_drafts").delete().eq("id", draftId);

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("VERIFY ERROR:", e);
    const err = e as { code?: string };
    if (err.code === "23505") {
      return new Response(
        JSON.stringify({
          error: "You have already reviewed this business.",
        }),
        { status: 400 },
      );
    }
    if (typeof err.code === "string" && err.code.length > 0) {
      return NextResponse.json(
        { error: "Could not publish review. Please try again." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Invalid or expired code" },
      { status: 400 },
    );
  }
}
