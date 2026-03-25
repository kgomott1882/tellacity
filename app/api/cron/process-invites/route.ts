export const runtime = "nodejs";

/**
 * Cron worker: process scheduled invite emails and reminders.
 *
 * Called every 5 minutes by Vercel Cron (see vercel.json).
 * Protected by Authorization: Bearer <CRON_SECRET> (Vercel Cron standard).
 *
 * Pass 1 - Due invites:
 *   sent_at IS NULL AND send_at <= now() AND status IN ('pending','draft','scheduled')
 *   For each: render email, send via Resend, set sent_at + status='sent'.
 *
 * Pass 2 - Due reminders:
 *   reminder_sent_at IS NULL AND reminder_at <= now() AND sent_at IS NOT NULL
 *   AND no review exists yet for this invite.
 *   For each: render reminder email, send via Resend, set reminder_sent_at.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";
import { renderInviteEmail } from "@/lib/inviteEmail";
import { getActivePlanKeyForBusiness } from "@/lib/plans";

// ── Types ─────────────────────────────────────────────────────────────────────

type InviteRow = {
  id: string;
  business_id: string;
  recipient_email: string;
  token: string;
  status: string;
  send_at: string | null;
  sent_at: string | null;
  reminder_at: string | null;
  reminder_sent_at: string | null;
};

type BusinessRow = {
  id: string;
  name: string | null;
};

type InviteSettings = {
  custom_subject: string | null;
  custom_message: string | null;
  custom_signature: string | null;
  legal_footer_enabled: boolean;
};

type TemplateRow = {
  subject: string | null;
  body: string | null;
  signature_logo_url?: string | null;
  signature_name?: string | null;
  signature_title?: string | null;
  signature_phone?: string | null;
  signature_website?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSupabase() {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
}

function buildInviteLink(token: string): string {
  const base = getBaseUrl();
  if (!base) return "#";
  return `${base}/review/invite?token=${token}`;
}

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSignatureBlock(template: TemplateRow | null, isPremiumOrElite: boolean): string {
  if (!isPremiumOrElite || !template) return "";
  const t = template as Record<string, unknown>;
  return `
<div style="margin-top:32px; border-top:1px solid #eee; padding-top:16px;">
  ${t.signature_logo_url ? `<div style="margin-bottom:12px;"><img src="${esc(t.signature_logo_url as string)}" alt="" style="max-height:60px;" /></div>` : ""}
  ${t.signature_name ? `<strong>${esc(t.signature_name as string)}</strong><br/>` : ""}
  ${t.signature_title ? `${esc(t.signature_title as string)}<br/>` : ""}
  ${t.signature_phone ? `${esc(t.signature_phone as string)}<br/>` : ""}
  ${t.signature_website ? `<a href="${esc(t.signature_website as string)}" target="_blank" rel="noopener noreferrer">${esc(t.signature_website as string)}</a>` : ""}
</div>
`.trim();
}

async function getInviteSettingsForBusiness(
  supabase: ReturnType<typeof makeSupabase>,
  businessId: string
): Promise<InviteSettings> {
  const { data } = await supabase
    .from("business_invite_settings")
    .select("custom_subject, custom_message, custom_signature, legal_footer_enabled")
    .eq("business_id", businessId)
    .maybeSingle();
  return {
    custom_subject:       data?.custom_subject       ?? null,
    custom_message:       data?.custom_message       ?? null,
    custom_signature:     data?.custom_signature     ?? null,
    legal_footer_enabled: data?.legal_footer_enabled ?? false,
  };
}

async function getEmailTemplate(
  supabase: ReturnType<typeof makeSupabase>,
  businessId: string
): Promise<TemplateRow | null> {
  const { data } = await supabase
    .from("review_invite_email_templates")
    .select("subject, body, signature_logo_url, signature_name, signature_title, signature_phone, signature_website")
    .eq("business_id", businessId)
    .eq("template_key", "standard")
    .maybeSingle();
  return (data as TemplateRow | null) ?? null;
}

async function isPremiumOrElite(
  supabase: ReturnType<typeof makeSupabase>,
  businessId: string
): Promise<boolean> {
  const plan = await getActivePlanKeyForBusiness(businessId, supabase);
  return plan === "premium" || plan === "elite";
}

async function hasReviewForInvite(
  supabase: ReturnType<typeof makeSupabase>,
  inviteId: string
): Promise<boolean> {
  // Check if a review has been submitted that references this invite.
  // The reviews table may link via invite_id or review_invite_id; try both.
  const { count: c1 } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("invite_id", inviteId);
  if ((c1 ?? 0) > 0) return true;

  const { count: c2 } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("review_invite_id", inviteId);
  if ((c2 ?? 0) > 0) return true;

  return false;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth: Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  if (token !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[process-invites] RESEND_API_KEY is not set.");
    return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  const supabase = makeSupabase();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const nowIso = new Date().toISOString();

  let processedInvites = 0;
  let sentInvites = 0;
  let failedInvites = 0;
  let processedReminders = 0;
  let sentReminders = 0;
  let failedReminders = 0;

  // ── Pass 1: Due invite emails ─────────────────────────────────────────────

  const { data: dueInvites, error: fetchErr } = await supabase
    .from("review_invites")
    .select("id, business_id, recipient_email, token, status, send_at, sent_at, reminder_at, reminder_sent_at")
    .is("sent_at", null)
    .lte("send_at", nowIso)
    .in("status", ["pending", "draft", "scheduled"])
    .limit(100);

  if (fetchErr) {
    console.error("[process-invites] Failed to fetch due invites:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  for (const invite of (dueInvites ?? []) as InviteRow[]) {
    processedInvites++;
    try {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("id", invite.business_id)
        .maybeSingle();

      const businessName = (biz as BusinessRow | null)?.name ?? "";
      const inviteLink = buildInviteLink(invite.token);

      const [settings, template, premium] = await Promise.all([
        getInviteSettingsForBusiness(supabase, invite.business_id),
        getEmailTemplate(supabase, invite.business_id),
        isPremiumOrElite(supabase, invite.business_id),
      ]);

      const signatureBlock = buildSignatureBlock(template, premium);

      const { subject, html } = renderInviteEmail({
        businessName,
        inviteLink,
        customSubject:       settings.custom_subject   || template?.subject || null,
        customMessage:       settings.custom_message   || template?.body    || null,
        customSignature:     settings.custom_signature ?? null,
        legalFooterEnabled:  settings.legal_footer_enabled,
        signatureBlock,
        isReminder: false,
      });

      const emailRes = await resend.emails.send({
        from: "Tellacity <notifications@tellacity.com>",
        to: invite.recipient_email,
        subject,
        html,
      });

      if (emailRes.error) {
        throw new Error(String(emailRes.error));
      }

      await supabase
        .from("review_invites")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_send_error: null,
        })
        .eq("id", invite.id);

      sentInvites++;
    } catch (err: unknown) {
      failedInvites++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[process-invites] Failed to send invite ${invite.id}:`, msg);
      await supabase
        .from("review_invites")
        .update({ last_send_error: msg })
        .eq("id", invite.id);
    }
  }

  // ── Pass 2: Due reminder emails ───────────────────────────────────────────

  const { data: dueReminders, error: reminderFetchErr } = await supabase
    .from("review_invites")
    .select("id, business_id, recipient_email, token, status, send_at, sent_at, reminder_at, reminder_sent_at")
    .is("reminder_sent_at", null)
    .not("reminder_at", "is", null)
    .lte("reminder_at", nowIso)
    .not("sent_at", "is", null) // only remind if the first email was sent
    .limit(100);

  if (reminderFetchErr) {
    console.error("[process-invites] Failed to fetch due reminders:", reminderFetchErr);
    // Return partial results rather than failing entirely
    return NextResponse.json({
      processedInvites,
      sentInvites,
      failedInvites,
      processedReminders,
      sentReminders,
      failedReminders,
      reminderFetchError: reminderFetchErr.message,
    });
  }

  for (const invite of (dueReminders ?? []) as InviteRow[]) {
    processedReminders++;
    try {
      // Skip if the customer already left a review
      const reviewed = await hasReviewForInvite(supabase, invite.id);
      if (reviewed) {
        // Mark reminder as sent so we don't keep checking
        await supabase
          .from("review_invites")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", invite.id);
        sentReminders++;
        continue;
      }

      const { data: biz } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("id", invite.business_id)
        .maybeSingle();

      const businessName = (biz as BusinessRow | null)?.name ?? "";
      const inviteLink = buildInviteLink(invite.token);

      const [settings, template, premium] = await Promise.all([
        getInviteSettingsForBusiness(supabase, invite.business_id),
        getEmailTemplate(supabase, invite.business_id),
        isPremiumOrElite(supabase, invite.business_id),
      ]);

      const signatureBlock = buildSignatureBlock(template, premium);

      const { subject, html } = renderInviteEmail({
        businessName,
        inviteLink,
        customSubject:       settings.custom_subject   || template?.subject || null,
        customMessage:       settings.custom_message   || template?.body    || null,
        customSignature:     settings.custom_signature ?? null,
        legalFooterEnabled:  settings.legal_footer_enabled,
        signatureBlock,
        isReminder: true,
      });

      const emailRes = await resend.emails.send({
        from: "Tellacity <notifications@tellacity.com>",
        to: invite.recipient_email,
        subject,
        html,
      });

      if (emailRes.error) {
        throw new Error(String(emailRes.error));
      }

      await supabase
        .from("review_invites")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", invite.id);

      sentReminders++;
    } catch (err: unknown) {
      failedReminders++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[process-invites] Failed to send reminder for invite ${invite.id}:`, msg);
      // Do not overwrite last_send_error here; it belongs to the primary send
    }
  }

  return NextResponse.json({
    processedInvites,
    sentInvites,
    failedInvites,
    processedReminders,
    sentReminders,
    failedReminders,
  });
}
