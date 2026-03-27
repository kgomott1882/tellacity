export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getActivePlanKeyForBusiness } from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import { EMAIL_WIDGET_CTA_BORDER, EMAIL_WIDGET_CTA_TEXT } from "@/lib/emailBranding";

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

/**
 * Email clients (e.g. Gmail) strip inline SVG — Unicode stars on light squares, black glyphs.
 */
function buildEmailStarsRowHtml(opts?: { marginBottom?: string }): string {
  const mb = opts?.marginBottom ?? "16px";
  const star = `<span style="display:inline-block;width:22px;height:22px;margin:0 3px;background:#ffffff;border:1px solid #E5E7EB;border-radius:3px;text-align:center;line-height:22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;vertical-align:middle;">&#9733;</span>`;
  const stars = Array.from({ length: 5 }, () => star).join("");
  return `<div style="margin-bottom:${mb};text-align:center;font-size:0;line-height:0;">${stars}</div>`;
}

/** Table-based footer: text only (no icon — email-safe). */
function buildBrandingLine(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;"><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666666;">
<span style="white-space:nowrap;">Verified reviews powered by <strong style="color:#000000;">Tellacity</strong></span>
</td></tr></table>`;
}

function buildWidgetHtml(opts: {
  introMessage: string;
  reviewLink: string;
  signatureBlock: string;
  removeBranding: boolean;
}): string {
  const { introMessage, reviewLink, signatureBlock, removeBranding } = opts;

  const introParagraph = introMessage
    ? `<p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 20px 0;">${introMessage
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")}</p>`
    : "";

  const starsRow = buildEmailStarsRowHtml();
  const brandingLine = removeBranding ? "" : buildBrandingLine();

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f8f8f8;">
<div style="font-family:Arial, sans-serif; padding:20px; background:#f8f8f8;">
  <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">
    ${introParagraph}
    <div style="margin:24px 0; padding:20px; border:1px solid #e5e5e5; border-radius:8px; text-align:center;">
      <h3 style="margin:0 0 12px 0; font-size:16px; color:#111;">Tell us about your experience</h3>
      ${starsRow}
      <a href="${reviewLink}"
         style="display:inline-block; padding:7px 18px; background-color:transparent; border:1px solid ${EMAIL_WIDGET_CTA_BORDER}; color:${EMAIL_WIDGET_CTA_TEXT}; text-decoration:none; border-radius:4px; font-weight:600; font-size:13px; line-height:1.2;">
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
}): string {
  const { introMessage, reviewLink, signatureBlock, businessName, businessLogoUrl } = opts;

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

  const starsRow = `<div style="margin:25px 0;">${buildEmailStarsRowHtml({ marginBottom: "0" })}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
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
         style="display:inline-block; padding:7px 18px; background-color:transparent; border:1px solid ${EMAIL_WIDGET_CTA_BORDER}; color:${EMAIL_WIDGET_CTA_TEXT}; text-decoration:none; border-radius:4px; font-weight:600; font-size:13px; line-height:1.2;">
        Leave a Review
      </a>

      ${buildBrandingLine()}
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
        })
      : buildWidgetHtml({ introMessage, reviewLink, signatureBlock, removeBranding });

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
