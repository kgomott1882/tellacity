import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  resolveUser,
  getOwnedBusiness,
  unauthorized,
  notFound,
  badRequest,
  serverError,
} from "../_shared";

export async function POST(request: Request) {
  try {
    const { user, supabase } = await resolveUser(request);
    if (!user || !supabase) return unauthorized();

    const business = await getOwnedBusiness(supabase, user.id);
    if (!business) return notFound();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const inviteId = typeof body.inviteId === "string" ? body.inviteId.trim() : "";
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!inviteId) return badRequest("inviteId is required.");
    if (!emailRaw || !/\S+@\S+\.\S+/.test(emailRaw)) {
      return badRequest("Valid email is required.");
    }

    const { data: invite, error: fetchErr } = await supabase
      .from("business_member_invites")
      .select("id, email, role, status, business_id")
      .eq("id", inviteId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[team-access invite-update] fetch:", fetchErr);
      return serverError(fetchErr.message);
    }
    if (!invite) return notFound("Invite not found.");
    if ((invite as { status: string }).status !== "pending") {
      return badRequest("Only pending invitations can be edited.");
    }

    const currentEmail = String((invite as { email: string }).email).trim().toLowerCase();
    if (emailRaw === currentEmail) {
      return badRequest("Enter a new email or use “Resend” to send the same link again.");
    }

    const { data: clash } = await supabase
      .from("business_member_invites")
      .select("id")
      .eq("business_id", business.id)
      .eq("email", emailRaw)
      .eq("status", "pending")
      .neq("id", inviteId)
      .maybeSingle();

    if (clash) {
      return badRequest("There is already a pending invite for that email.");
    }

    const newToken = crypto.randomUUID();
    const { error: updErr } = await supabase
      .from("business_member_invites")
      .update({
        email: emailRaw,
        token: newToken,
        invited_by: user.id,
        created_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .eq("business_id", business.id)
      .eq("status", "pending");

    if (updErr) {
      console.error("[team-access invite-update] update:", updErr);
      return serverError(updErr.message);
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("[team-access invite-update] RESEND_API_KEY is not set");
      return serverError("Email service not configured.");
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof request.url === "string" ? new URL(request.url).origin : "")
    ).replace(/\/$/, "");

    const acceptUrl = `${appUrl}/auth/accept-invite?token=${newToken}`;
    const role = (invite as { role: string }).role;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from: "Tellacity <support@tellacity.com>",
      to: emailRaw,
      subject: `You've been invited to manage reviews for ${business.name ?? "a business"} on Tellacity`,
      html: `
<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:600px;">
  <p>You have been invited to join <strong>${business.name ?? "a business"}</strong> on Tellacity as <strong>${role}</strong>.</p>
  <p>Click the button below to set up your account and get started. You will be asked to create your own password.</p>
  <div style="margin:24px 0;">
    <a href="${acceptUrl}"
       style="display:inline-block;padding:12px 20px;background:#0E4E45;color:#fff;
              text-decoration:none;border-radius:6px;font-weight:600;">
      Accept invitation &amp; set up account
    </a>
  </div>
  <p style="font-size:12px;color:#777;">
    If the button does not work, copy and paste this link into your browser:<br/>
    <a href="${acceptUrl}" style="color:#0E4E45;word-break:break-all;">${acceptUrl}</a>
  </p>
  <p style="font-size:11px;color:#aaa;margin-top:24px;">
    If you did not expect this invitation, you can safely ignore this email.
  </p>
</div>`.trim(),
    });

    if (emailErr) {
      console.error("[team-access invite-update] email:", emailErr);
      return NextResponse.json(
        { error: "Email updated but the message could not be sent. Resend the invite from the dashboard." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, email: emailRaw });
  } catch (error: unknown) {
    console.error("[team-access invite-update] unhandled:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update invite." },
      { status: 500 }
    );
  }
}
