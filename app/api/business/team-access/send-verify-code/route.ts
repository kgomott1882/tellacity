import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  resolveUser,
  unauthorized,
  badRequest,
  notFound,
  serverError,
} from "../_shared";

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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
    if (!token) return badRequest("token is required.");

    const { data: inv, error: invErr } = await supabase
      .from("business_member_invites")
      .select("id, email, status, business_id")
      .eq("token", token)
      .maybeSingle();

    if (invErr) {
      console.error("[send-verify-code] invite:", invErr);
      return serverError(invErr.message);
    }
    if (!inv) return notFound("Invite not found.");
    if ((inv as { status: string }).status !== "pending") {
      return badRequest("This invitation is no longer active.");
    }
    const inviteEmail = String((inv as { email: string }).email).trim().toLowerCase();
    if (inviteEmail !== email) {
      return badRequest("Sign in with the email address this invitation was sent to.");
    }

    await supabase.from("team_invite_otps").delete().eq("invite_id", (inv as { id: string }).id).eq("user_id", user.id);

    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insErr } = await supabase.from("team_invite_otps").insert({
      invite_id: (inv as { id: string }).id,
      user_id: user.id,
      code,
      expires_at: expiresAt,
    });

    if (insErr) {
      console.error("[send-verify-code] insert otp:", insErr);
      return serverError(insErr.message);
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[send-verify-code] RESEND_API_KEY missing");
      return serverError("Email service not configured.");
    }

    let bizName = "your team";
    const bid = (inv as { business_id?: string }).business_id;
    if (bid) {
      const { data: b } = await supabase.from("businesses").select("name").eq("id", bid).maybeSingle();
      if (b && typeof (b as { name?: string }).name === "string" && (b as { name: string }).name.trim()) {
        bizName = (b as { name: string }).name.trim();
      }
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from: "Tellacity <support@tellacity.com>",
      to: email,
      subject: `${code} is your Tellacity team invite verification code`,
      html: `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:15px;color:#222;max-width:560px;">
<p>Enter this code to finish joining <strong>${escapeHtml(bizName)}</strong> on Tellacity:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:24px 0;">${escapeHtml(code)}</p>
<p style="color:#666;font-size:13px;">This code expires in 15 minutes. If you did not request it, you can ignore this email.</p>
</body></html>`,
    });

    if (emailErr) {
      console.error("[send-verify-code] Resend:", emailErr);
      await supabase.from("team_invite_otps").delete().eq("invite_id", (inv as { id: string }).id).eq("user_id", user.id);
      return NextResponse.json({ error: "Could not send the verification email. Try again shortly." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("[send-verify-code] unhandled:", e);
    return serverError("Unexpected server error.");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
