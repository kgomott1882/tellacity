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
    if (!inviteId) return badRequest("inviteId is required.");

    // Fetch the invite - must belong to this business and still be pending
    const { data: invite, error: fetchErr } = await supabase
      .from("business_member_invites")
      .select("id, email, role, token, status")
      .eq("id", inviteId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (fetchErr) {
      console.error("[team-access resend] fetch:", fetchErr);
      return serverError(fetchErr.message);
    }
    if (!invite) return notFound("Invite not found.");
    if ((invite as any).status !== "pending") {
      return badRequest("Only pending invites can be resent.");
    }

    // Issue a fresh token and bump created_at so the new link is valid
    const { data: refreshed, error: refreshErr } = await supabase
      .from("business_member_invites")
      .update({
        token: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      })
      .eq("id", inviteId)
      .select("token")
      .single();

    if (refreshErr || !refreshed) {
      console.error("[team-access resend] refresh token:", refreshErr);
      return serverError("Failed to refresh invite token.");
    }
    // Use the new token for the email link
    (invite as any).token = (refreshed as any).token;

    if (!process.env.RESEND_API_KEY) {
      console.error("[team-access resend] RESEND_API_KEY is not set");
      return serverError("Email service not configured.");
    }

    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof request.url === "string" ? new URL(request.url).origin : "")
    ).replace(/\/$/, "");

    const acceptUrl = `${appUrl}/auth/accept-invite?token=${(invite as any).token}`;

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: emailErr } = await resend.emails.send({
      from: "Tellacity <support@tellacity.com>",
      to: (invite as any).email,
      subject: `Reminder: You've been invited to manage reviews for ${business.name ?? "a business"} on Tellacity`,
      html: `
<div style="font-family:Arial,sans-serif;font-size:14px;color:#222;max-width:600px;">
  <p>This is a reminder that you have been invited to join <strong>${business.name ?? "a business"}</strong> on Tellacity as <strong>${(invite as any).role}</strong>.</p>
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
      console.error("[team-access resend] email error:", emailErr);
      return NextResponse.json(
        { error: "Could not send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[team-access resend] unhandled:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to resend invite." },
      { status: 500 }
    );
  }
}
