export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "crypto";
import { getServerEnv } from "@/lib/serverEnv";
import { renderInviteEmail } from "@/lib/inviteEmail";
import {
  getActivePlanKeyForBusiness,
  getMonthlyInviteLimitForBusiness,
} from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, recipientEmail, template: templateType } = body;

    if (!businessId || !recipientEmail) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(recipientEmail)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // ── Business lookup ──────────────────────────────────────────────────────
    const { data: bizRecord, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", businessId)
      .maybeSingle();

    if (bizError) {
      console.error("Business lookup error:", bizError);
      return NextResponse.json(
        { error: "Failed to load business." },
        { status: 500 }
      );
    }
    if (!bizRecord) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 400 }
      );
    }

    // ── Plan base + admin bonus monthly limit (matches dashboard + admin controls) ──
    const limit = await getMonthlyInviteLimitForBusiness(businessId, supabase);
    const effectivePlan = await getActivePlanKeyForBusiness(businessId, supabase);

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const { count: monthlyCount, error: countError } = await supabase
      .from("review_invites")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", startOfMonth.toISOString());

    if (countError) {
      console.error("Invite count error:", countError);
      return NextResponse.json(
        { error: "Failed to check invite usage." },
        { status: 500 }
      );
    }

    if ((monthlyCount ?? 0) >= limit) {
      return NextResponse.json(
        { error: "Monthly invite limit reached." },
        { status: 403 }
      );
    }

    // ── Load invite settings ─────────────────────────────────────────────────
    const { data: inviteSettings } = await supabase
      .from("business_invite_settings")
      .select(
        "send_delay_days, reminder_enabled, reminder_delay_days, custom_subject, custom_message, custom_signature, legal_footer_enabled"
      )
      .eq("business_id", businessId)
      .maybeSingle();

    const sendDelayDays: number = inviteSettings?.send_delay_days ?? 0;
    const reminderEnabled: boolean = inviteSettings?.reminder_enabled ?? false;
    const reminderDelayDays: number = inviteSettings?.reminder_delay_days ?? 3;

    // ── Compute schedule timestamps ──────────────────────────────────────────
    const now = new Date();

    const sendAt = new Date(now);
    sendAt.setUTCDate(sendAt.getUTCDate() + sendDelayDays);

    let reminderAt: Date | null = null;
    if (reminderEnabled) {
      reminderAt = new Date(sendAt);
      reminderAt.setUTCDate(reminderAt.getUTCDate() + reminderDelayDays);
    }

    const sendImmediately = sendDelayDays === 0;

    // ── Insert invite row (single raw token; no hashing or mutation) ─────────
    const token = crypto.randomBytes(32).toString("hex");
    const createdAt = new Date().toISOString();

    const { data: insertedRow, error: insertError } = await supabase
      .from("review_invites")
      .insert({
        token,
        business_id: businessId,
        recipient_email: recipientEmail,
        status: "pending",
        created_at: createdAt,
        channel: "email",
        send_at: sendAt.toISOString(),
        reminder_at: reminderAt ? reminderAt.toISOString() : null,
      })
      .select("id")
      .maybeSingle();

    if (insertError) {
      console.error("INVITE INSERT ERROR:", insertError);
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This email has already been invited." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: insertError.message,
          details: insertError,
        },
        { status: 500 }
      );
    }

    const inviteId = (insertedRow as { id?: string } | null)?.id;
    if (!inviteId) {
      console.error("Invite insert returned no id.");
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    // ── If delayed, return early - cron worker will send later ───────────────
    if (!sendImmediately) {
      return NextResponse.json({
        success: true,
        scheduled: true,
        sendAt: sendAt.toISOString(),
        reminderAt: reminderAt ? reminderAt.toISOString() : null,
      });
    }

    // ── Send immediately (same `token` as stored; no encodeURIComponent) ──────
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const inviteLink = baseUrl
      ? `${baseUrl}/review/invite?token=${token}`
      : "#";

    // Load email template (subject/body overrides from review_invite_email_templates)
    const templateKey = templateType === "custom" ? "custom" : "standard";
    const { data: template } = await supabase
      .from("review_invite_email_templates")
      .select("*")
      .eq("business_id", businessId)
      .eq("template_key", templateKey)
      .maybeSingle();

    let templateSubject: string | null = null;
    let templateBody: string | null = null;

    if (template?.subject) templateSubject = String(template.subject).trim() || null;
    if (template?.body != null && String(template.body).trim())
      templateBody = String(template.body).trim();

    // Fallback to other template type if primary is empty
    if (!templateSubject || !templateBody) {
      const { data: fallbackRow } = await supabase
        .from("review_invite_email_templates")
        .select("subject, body")
        .eq("business_id", businessId)
        .eq("template_key", templateKey === "custom" ? "standard" : "custom")
        .maybeSingle();
      if (!templateSubject && fallbackRow?.subject)
        templateSubject = String(fallbackRow.subject).trim() || null;
      if (!templateBody && fallbackRow?.body != null && String(fallbackRow.body).trim())
        templateBody = String(fallbackRow.body).trim();
    }

    // Build premium/elite signature block from template columns
    const t = template as Record<string, unknown> | null;
    const esc = (s: string | null | undefined) =>
      s == null
        ? ""
        : String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    let signatureBlock = "";
    if (effectivePlan === "premium" || effectivePlan === "elite") {
      signatureBlock = `
  <div style="margin-top:32px; border-top:1px solid #eee; padding-top:16px;">
    ${t?.signature_logo_url ? `<div style="margin-bottom:12px;"><img src="${esc(t.signature_logo_url as string)}" alt="" style="max-height:60px;" /></div>` : ""}
    ${t?.signature_name ? `<strong>${esc(t.signature_name as string)}</strong><br/>` : ""}
    ${t?.signature_title ? `${esc(t.signature_title as string)}<br/>` : ""}
    ${t?.signature_phone ? `${esc(t.signature_phone as string)}<br/>` : ""}
    ${t?.signature_website ? `<a href="${esc(t.signature_website as string)}" target="_blank" rel="noopener noreferrer">${esc(t.signature_website as string)}</a>` : ""}
  </div>
`;
    }

    const layoutStyle =
      (template as { layout_style?: string | null } | null)?.layout_style ?? "standard";

    // Render final email - invite settings overrides take priority over template
    const rendered = renderInviteEmail({
      businessName: bizRecord.name ?? "",
      inviteLink,
      customSubject:       inviteSettings?.custom_subject   || templateSubject || null,
      customMessage:       inviteSettings?.custom_message   || templateBody    || null,
      customSignature:     inviteSettings?.custom_signature ?? null,
      legalFooterEnabled:  inviteSettings?.legal_footer_enabled ?? false,
      signatureBlock,
      layoutStyle,
      isReminder: false,
    });
    const subject = rendered.subject;

    const escHtml = (s: string | null | undefined) =>
      s == null
        ? ""
        : String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    const bodyText = String(
      inviteSettings?.custom_message || templateBody || "We'd love your feedback."
    ).trim();
    const safeInviteLink = escHtml(inviteLink);

    const ratingWidgetHtml = `
<div style="font-family:Arial, sans-serif; font-size:14px; color:#222; max-width:600px;">
  <p style="margin:0 0 14px 0;">${escHtml(bodyText).replace(/\n/g, "<br/>")}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:14px 0 12px 0;">
    <tr>
      <td align="center" style="font-size:22px; font-weight:700; color:#111827; padding-bottom:12px;">
        How did we do?
      </td>
    </tr>
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:4px;"><a href="${safeInviteLink}&rating=1" style="display:inline-block; padding:10px 12px; background:#ef4444; color:#ffffff; font-size:20px; line-height:1; text-decoration:none; border-radius:4px;">★</a></td>
            <td style="padding:4px;"><a href="${safeInviteLink}&rating=2" style="display:inline-block; padding:10px 12px; background:#f97316; color:#ffffff; font-size:20px; line-height:1; text-decoration:none; border-radius:4px;">★</a></td>
            <td style="padding:4px;"><a href="${safeInviteLink}&rating=3" style="display:inline-block; padding:10px 12px; background:#facc15; color:#ffffff; font-size:20px; line-height:1; text-decoration:none; border-radius:4px;">★</a></td>
            <td style="padding:4px;"><a href="${safeInviteLink}&rating=4" style="display:inline-block; padding:10px 12px; background:#22c55e; color:#ffffff; font-size:20px; line-height:1; text-decoration:none; border-radius:4px;">★</a></td>
            <td style="padding:4px;"><a href="${safeInviteLink}&rating=5" style="display:inline-block; padding:10px 12px; background:#10b981; color:#ffffff; font-size:20px; line-height:1; text-decoration:none; border-radius:4px;">★</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding-top:14px;">
        <a href="${safeInviteLink}" style="color:#0E4E45; text-decoration:underline;">Leave a review</a>
      </td>
    </tr>
  </table>
  ${signatureBlock}
</div>
`.trim();

    const html = layoutStyle === "rating_widget" ? ratingWidgetHtml : rendered.html;

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return NextResponse.json(
        { error: "Internal server error." },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      const emailResponse = await resend.emails.send({
        from: "Tellacity <notifications@tellacity.com>",
        to: recipientEmail,
        subject,
        html,
      });
      if (emailResponse.error) {
        console.error("Resend API error:", emailResponse.error);
        await supabase
          .from("review_invites")
          .update({ last_send_error: String(emailResponse.error) })
          .eq("id", inviteId);
        return NextResponse.json(
          { error: "Failed to send invite email." },
          { status: 500 }
        );
      }
    } catch (err) {
      console.error("Resend send failed:", err);
      await supabase
        .from("review_invites")
        .update({ last_send_error: String(err) })
        .eq("id", inviteId);
      return NextResponse.json(
        { error: "Failed to send invite email." },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("review_invites")
      .update({
        sent_at: new Date().toISOString(),
        last_send_error: null,
      })
      .eq("id", inviteId);

    if (updateError) {
      console.error("Failed to mark invite as sent:", updateError);
      // Email was sent; still return success
    }

    return NextResponse.json({ success: true, scheduled: false });
  } catch (err: unknown) {
    console.error("Unhandled invite error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
