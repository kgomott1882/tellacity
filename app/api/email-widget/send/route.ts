export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getActivePlanKeyForBusiness } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";

function isPremiumOrElite(plan: string): boolean {
  return plan === "premium" || plan === "elite";
}

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSignatureBlock(t: Record<string, unknown>): string {
  const enabled = Boolean(t.signature_enabled);
  if (!enabled) return "";

  const name = esc(t.signature_name as string);
  const title = esc(t.signature_title as string);
  const phone = esc(t.signature_phone as string);
  const website = esc(t.signature_website as string);
  const logoUrl = esc(t.signature_logo_url as string);
  const address = esc(t.signature_address as string);
  const ctaText = esc(t.signature_cta_text as string);
  const ctaUrl = esc(t.signature_cta_url as string);

  const lines: string[] = [];

  if (logoUrl) {
    lines.push(`<div style="margin-bottom:12px;"><img src="${logoUrl}" alt="" style="max-height:60px;" /></div>`);
  }
  if (name) lines.push(`<strong style="font-size:14px;">${name}</strong>`);
  if (title) lines.push(`<div style="font-size:13px; color:#555;">${title}</div>`);
  if (phone) lines.push(`<div style="font-size:13px; color:#555;">${phone}</div>`);
  if (address) lines.push(`<div style="font-size:12px; color:#777; white-space:pre-line;">${address}</div>`);
  if (website) {
    lines.push(`<div style="font-size:13px;"><a href="${website}" style="color:#1FAF9E;">${website}</a></div>`);
  }
  if (ctaText && ctaUrl) {
    lines.push(`<div style="margin-top:8px;"><a href="${ctaUrl}" style="display:inline-block; padding:8px 16px; background:#1FAF9E; color:#fff; text-decoration:none; border-radius:4px; font-size:13px; font-weight:600;">${ctaText}</a></div>`);
  }

  if (lines.length === 0) return "";

  return `
<div style="margin-top:24px; padding-top:16px; border-top:1px solid #e5e5e5; font-family:Arial, sans-serif;">
  ${lines.join("\n  ")}
</div>`;
}

/** One Tellacity-style star box (inline CSS, email-safe). */
function starBox(color: string): string {
  return `<span style="display:inline-block; width:22px; height:22px; background:${color}; border:1px solid ${color}; border-radius:3px; text-align:center; line-height:22px; margin:0 2px; vertical-align:middle;">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; vertical-align:middle;">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  </span>`;
}

function buildBrandingLine(iconUrl: string): string {
  return `<div style="margin-top:14px; display:inline-flex; align-items:center; gap:4px;">
    <span style="font-size:11px; color:#666666; vertical-align:middle; font-family:Arial, sans-serif;">Verified reviews powered by</span>
    <img src="${iconUrl}" alt="Tellacity" style="height:16px; width:16px; vertical-align:middle;" />
    <strong style="font-size:11px; color:#000000; vertical-align:middle; font-family:Arial, sans-serif;">Tellacity</strong>
  </div>`;
}

function buildWidgetHtml(opts: {
  introMessage: string;
  reviewLink: string;
  signatureBlock: string;
  removeBranding: boolean;
  baseUrl: string;
}): string {
  const { introMessage, reviewLink, signatureBlock, removeBranding, baseUrl } = opts;

  const introParagraph = introMessage
    ? `<p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 20px 0;">${introMessage
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")}</p>`
    : "";

  const starsRow = `<div style="margin-bottom:16px;">${[1,2,3,4,5].map(() => starBox("#12B76A")).join("")}</div>`;
  const iconUrl = `${baseUrl.replace(/\/$/, "")}/brand/appicon.png.png`;
  const brandingLine = removeBranding ? "" : buildBrandingLine(iconUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f8f8f8;">
<div style="font-family:Arial, sans-serif; padding:20px; background:#f8f8f8;">
  <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">
    ${introParagraph}
    <div style="margin:24px 0; padding:20px; border:1px solid #e5e5e5; border-radius:8px; text-align:center;">
      <h3 style="margin:0 0 12px 0; font-size:16px; color:#111;">Tell us about your experience</h3>
      ${starsRow}
      <a href="${reviewLink}"
         style="display:inline-block; padding:12px 20px; background:#1FAF9E; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">
        Leave a Review
      </a>
      ${brandingLine}
    </div>
    ${signatureBlock}
  </div>
</div>
</body>
</html>`;
}

function buildEliteBrandedHtml(opts: {
  introMessage: string;
  reviewLink: string;
  signatureBlock: string;
  businessName: string;
  businessLogoUrl: string | null;
  baseUrl: string;
}): string {
  const { introMessage, reviewLink, signatureBlock, businessName, businessLogoUrl, baseUrl } = opts;

  const iconUrl = `${baseUrl.replace(/\/$/, "")}/brand/appicon.png.png`;

  const logoBlock = businessLogoUrl
    ? `<img src="${esc(businessLogoUrl)}" alt="${esc(businessName)}" style="max-height:60px; margin-bottom:12px; display:block; margin-left:auto; margin-right:auto;" />`
    : "";

  const introEscaped = introMessage
    ? introMessage
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")
    : `We'd love to hear about your experience with ${esc(businessName)}. It only takes a minute.`;

  const starsRow = `<div style="margin:25px 0;">${[1,2,3,4,5].map(() => starBox("#12B76A")).join("")}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f4f6f8;">
<div style="font-family:Arial, sans-serif; background:#f4f6f8; padding:30px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05);">

    <!-- Business Header -->
    <div style="padding:24px; border-bottom:1px solid #eee; text-align:center;">
      ${logoBlock}
      <h2 style="margin:0; font-size:20px; color:#111;">${esc(businessName)}</h2>
    </div>

    <!-- Body -->
    <div style="padding:30px; text-align:center;">
      <p style="font-size:16px; color:#333; margin:0 0 8px 0;">${introEscaped}</p>

      ${starsRow}

      <a href="${reviewLink}"
         style="display:inline-block; padding:12px 24px; background:#1FAF9E; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:14px;">
        Leave a Review
      </a>

      <!-- Tellacity branding - always visible -->
      <div style="margin-top:24px; display:inline-flex; align-items:center; gap:4px;">
        <span style="font-size:11px; color:#666666; vertical-align:middle; font-family:Arial, sans-serif;">Verified reviews powered by</span>
        <img src="${iconUrl}" alt="Tellacity" style="height:16px; width:16px; vertical-align:middle;" />
        <strong style="font-size:11px; color:#000000; vertical-align:middle; font-family:Arial, sans-serif;">Tellacity</strong>
      </div>
    </div>

    ${signatureBlock ? `<div style="padding:0 30px 24px;">${signatureBlock}</div>` : ""}

  </div>
</div>
</body>
</html>`;
}

/**
 * POST /api/email-widget/send
 *
 * Sends a structured widget email (no invite token, no quota consumed).
 * Used by:
 *   - Get Reviews → Email Templates (widget card)
 *   - Share & Promote → Email Widgets
 *
 * Body:
 *   businessId   string
 *   recipients   string[]
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessId, recipients } = body as {
      businessId?: string;
      recipients?: string[];
    };

    if (!businessId || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const validEmails = recipients.map((e) => e.trim()).filter((e) => /\S+@\S+\.\S+/.test(e));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: "No valid email addresses provided." }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: bizRecord, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, slug, logo_url")
      .eq("id", businessId)
      .maybeSingle();

    if (bizError || !bizRecord) {
      return NextResponse.json({ error: "Business not found." }, { status: 400 });
    }

    const effectivePlan = await getActivePlanKeyForBusiness(businessId, supabase);

    if (!isPremiumOrElite(effectivePlan)) {
      return NextResponse.json(
        { error: "Email Widget is available on Premium and Elite plans only." },
        { status: 403 }
      );
    }

    // Load widget template (template_key = 'widget')
    const { data: tmpl } = await supabase
      .from("review_invite_email_templates")
      .select(
        "subject, intro_message, layout_style, signature_enabled, signature_name, signature_title, signature_phone, signature_website, signature_logo_url, signature_address, signature_cta_text, signature_cta_url, remove_tellacity_branding"
      )
      .eq("business_id", businessId)
      .eq("template_key", "widget")
      .maybeSingle();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const reviewLink = bizRecord.slug
      ? `${baseUrl.replace(/\/$/, "")}/b/${bizRecord.slug}/write-review`
      : baseUrl;

    const t = (tmpl ?? {}) as Record<string, unknown>;

    const subject = t.subject
      ? String(t.subject).trim()
      : `Share your experience with ${bizRecord.name ?? "us"}`;

    const introMessage = t.intro_message
      ? String(t.intro_message).trim()
      : `We'd love to hear about your experience with ${bizRecord.name ?? "us"}. It only takes a minute.`;

    const signatureBlock = buildSignatureBlock(t);
    const removeBranding = Boolean(t.remove_tellacity_branding);

    // Elite branded layout: only when plan is elite AND layout_style is 'elite_branded'
    const useEliteBranded =
      effectivePlan === "elite" && String(t.layout_style ?? "standard") === "elite_branded";

    const html = useEliteBranded
      ? buildEliteBrandedHtml({
          introMessage,
          reviewLink,
          signatureBlock,
          businessName: bizRecord.name ?? "",
          businessLogoUrl: (bizRecord as Record<string, unknown>).logo_url as string | null,
          baseUrl,
        })
      : buildWidgetHtml({ introMessage, reviewLink, signatureBlock, removeBranding, baseUrl });

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const sendResults = await Promise.allSettled(
      validEmails.map((to) =>
        resend.emails.send({
          from: "Tellacity <notifications@tellacity.com>",
          to,
          subject,
          html,
        })
      )
    );

    const failures = sendResults.filter((r) => r.status === "rejected").length;
    if (failures === validEmails.length) {
      return NextResponse.json({ error: "Failed to send emails." }, { status: 500 });
    }

    // Log best-effort
    supabase
      .from("email_widget_sends")
      .insert({
        business_id: businessId,
        recipient_count: validEmails.length - failures,
        sent_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("Failed to log widget send:", error.message);
      });

    return NextResponse.json({
      success: true,
      sent: validEmails.length - failures,
      failed: failures,
    });
  } catch (err) {
    console.error("Unhandled widget send error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
