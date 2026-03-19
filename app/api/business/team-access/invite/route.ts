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

const ALLOWED_ROLES = ["admin", "member"] as const;
type InviteRole = (typeof ALLOWED_ROLES)[number];

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

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role  = typeof body.role  === "string" ? body.role.trim()               : "";

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return badRequest("Valid email is required.");
    }
    if (!ALLOWED_ROLES.includes(role as InviteRole)) {
      return badRequest("Role must be 'admin' or 'member'.");
    }

    // Check if any invite already exists for this email (any status)
    const { data: existing } = await supabase
      .from("business_member_invites")
      .select("id, status")
      .eq("business_id", business.id)
      .eq("email", email)
      .maybeSingle();

    let invite: { id: string; token: string } | null = null;

    if (existing) {
      // Re-use the existing row: reset to pending with a fresh token, updated role and timestamp
      const { data: updated, error: updateErr } = await supabase
        .from("business_member_invites")
        .update({
          role,
          status: "pending",
          token: crypto.randomUUID(),
          invited_by: user.id,
          created_at: new Date().toISOString(),
          accepted_at: null,
        })
        .eq("id", existing.id)
        .select("id, token")
        .single();

      if (updateErr) {
        console.error("[team-access invite] update error:", updateErr);
        return serverError(updateErr.message);
      }
      invite = updated;
    } else {
      // No existing row - insert fresh
      const { data: inserted, error: insertErr } = await supabase
        .from("business_member_invites")
        .insert({
          business_id: business.id,
          email,
          role,
          invited_by: user.id,
        })
        .select("id, token")
        .single();

      if (insertErr) {
        console.error("[team-access invite] insert error:", insertErr);
        return serverError(insertErr.message);
      }
      invite = inserted;
    }

    if (!invite) return serverError("Failed to create invite.");

    // Send invite email via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error("[team-access invite] RESEND_API_KEY is not set");
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
      to: email,
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
      console.error("[team-access invite] email send error:", emailErr);
      return NextResponse.json(
        { error: "Invite created but email could not be sent. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Team invite error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send invite" },
      { status: 500 }
    );
  }
}
