import { NextResponse } from "next/server";
import {
  resolveUser,
  unauthorized,
  badRequest,
  notFound,
  serverError,
} from "../_shared";

export async function POST(req: Request) {
  try {
    const { user, supabase } = await resolveUser(req);
    if (!user || !supabase) return unauthorized();

    const email = user.email?.trim().toLowerCase();
    if (!email) return badRequest("Your account has no email address.");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    const rawCode = typeof body.code === "string" ? body.code.replace(/\D/g, "") : "";
    if (!token) return badRequest("token is required.");
    if (rawCode.length !== 6 || !/^\d{6}$/.test(rawCode)) {
      return badRequest("Enter the 6-digit code from your email.");
    }
    const code = rawCode;

    const { data: inv, error: invErr } = await supabase
      .from("business_member_invites")
      .select("id, email, status")
      .eq("token", token)
      .maybeSingle();

    if (invErr) {
      console.error("[verify-and-accept] invite:", invErr);
      return serverError(invErr.message);
    }
    if (!inv) return notFound("Invite not found.");
    const inviteEmail = String((inv as { email: string }).email).trim().toLowerCase();
    if (inviteEmail !== email) {
      return badRequest("Sign in with the email address this invitation was sent to.");
    }

    const inviteId = (inv as { id: string }).id;

    const { data: otpRows, error: otpErr } = await supabase
      .from("team_invite_otps")
      .select("id, code, expires_at, used_at")
      .eq("invite_id", inviteId)
      .eq("user_id", user.id)
      .eq("code", code)
      .is("used_at", null)
      .limit(1);

    if (otpErr) {
      console.error("[verify-and-accept] otp query:", otpErr);
      return serverError(otpErr.message);
    }

    const otpRow = otpRows?.[0] as { id: string; expires_at: string; used_at: string | null } | undefined;
    if (!otpRow) {
      return badRequest("Invalid code. Check the email or request a new code.");
    }
    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return badRequest("This code has expired. Request a new one.");
    }

    const authHeader = req.headers.get("authorization");
    const userToken = authHeader?.replace("Bearer ", "").trim() ?? "";
    if (!userToken) return unauthorized();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !anonKey) return serverError("Missing Supabase env vars.");

    const { createClient } = await import("@supabase/supabase-js");
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    const { error: rpcErr } = await userClient.rpc("accept_business_member_invite", {
      p_token: token,
    });

    if (rpcErr) {
      console.error("[verify-and-accept] rpc:", rpcErr);
      const msg = rpcErr.message ?? "";
      if (msg.includes("already used") || msg.includes("Invite not found")) {
        await supabase
          .from("team_invite_otps")
          .update({ used_at: new Date().toISOString() })
          .eq("id", otpRow.id);
        return NextResponse.json({ success: true, alreadyAccepted: true });
      }
      return badRequest(msg);
    }

    await supabase
      .from("team_invite_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    const { error: kindErr } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { account_kind: "business" },
    });
    if (kindErr) {
      console.warn("[verify-and-accept] account_kind:", kindErr.message);
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("[verify-and-accept] unhandled:", e);
    return serverError("Unexpected server error.");
  }
}
