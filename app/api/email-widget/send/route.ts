export const runtime = "nodejs";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  canAccessEmailWidget,
  canUseCustomEmail,
  getActivePlanKeyForBusiness,
  type PlanKey,
} from "@/lib/plans";
import { getServerEnv } from "@/lib/serverEnv";
import {
  EMAIL_WIDGET_CTA_BORDER,
  EMAIL_WIDGET_CTA_TEXT,
  getInviteFinalizeUrl,
  getPublicAppOrigin,
  getTellacityTrustBadgeLogoUrl,
} from "@/lib/emailBranding";
import { REVIEW_INVITE_SOURCE_EMAIL_WIDGET } from "@/lib/reviewInviteSource";
import {
  TELLACITY_STAR_EMPTY_BORDER,
  TELLACITY_STAR_TIER_COLORS,
  tellacityActiveStarColorForRating,
} from "@/lib/tellacityStarColors";

function planAllowsEmailWidgetSend(plan: PlanKey, layoutStyle: string): boolean {
  const ls = (layoutStyle || "standard").trim().toLowerCase();
  if (ls === "elite_branded") {
    return canAccessEmailWidget(plan, "elite_layout") && plan === "elite";
  }
  if (ls === "review_hunter") {
    return canAccessEmailWidget(plan, "premium_layout") && (plan === "premium" || plan === "elite");
  }
  if (ls === "rating_ladder") {
    return canUseCustomEmail(plan);
  }
  return canAccessEmailWidget(plan, "premium_layout");
}

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function insertEmailWidgetInvite(
  supabase: SupabaseClient,
  businessId: string,
  recipientEmail: string,
): Promise<{ ok: true; token: string } | { ok: false; message: string }> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const { error } = await supabase.from("review_invites").insert({
    token,
    business_id: businessId,
    recipient_email: recipientEmail.trim(),
    status: "pending",
    created_at: now,
    channel: "email",
    send_at: now,
    sent_at: now,
    reminder_at: null,
    source: REVIEW_INVITE_SOURCE_EMAIL_WIDGET,
  } as Record<string, unknown>);
  if (error) {
    console.error("[email-widget] review_invites insert:", error);
    return { ok: false, message: error.message };
  }
  return { ok: true, token };
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
 * Email clients (e.g. Gmail) strip inline SVG , Unicode stars on Tellacity tier-colored squares (matches WidgetStars at rating 5).
 */
function buildEmailStarsRowHtml(opts?: { marginBottom?: string }): string {
  const mb = opts?.marginBottom ?? "16px";
  const fill = TELLACITY_STAR_TIER_COLORS[4];
  const star = `<span style="display:inline-block;width:20px;height:20px;margin:0 3px;background:${fill};border:1px solid ${fill};border-radius:3px;text-align:center;line-height:20px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#ffffff;vertical-align:middle;">&#9733;</span>`;
  const stars = Array.from({ length: 5 }, () => star).join("");
  return `<div style="margin-bottom:${mb};text-align:center;font-size:0;line-height:0;">${stars}</div>`;
}

/** Unicode stars on squares: all filled cells use the same tier color as WidgetStars (rating 1–5). */
function buildEmailStarsRowForRating(
  rating: number,
  opts?: { textAlign?: "left" | "center" },
): string {
  const r = Math.min(5, Math.max(1, Math.round(Number(rating))));
  const fill = tellacityActiveStarColorForRating(r);
  const align = opts?.textAlign ?? "center";
  const parts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const isFilled = i < r;
    const bg = isFilled ? fill : "#ffffff";
    const borderColor = isFilled ? fill : TELLACITY_STAR_EMPTY_BORDER;
    const starCharColor = isFilled ? "#ffffff" : "#D0D5DD";
    parts.push(
      `<span style="display:inline-block;width:20px;height:20px;margin:0 3px;background:${bg};border:1px solid ${borderColor};border-radius:3px;text-align:center;line-height:20px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${starCharColor};vertical-align:middle;">&#9733;</span>`,
    );
  }
  return `<div style="text-align:${align};font-size:0;line-height:0;">${parts.join("")}</div>`;
}

/** Trustpilot-style rating ladder: rows open invite finalization with ?rating= (Tellacity tier stars). */
function buildRatingLadderHtml(opts: {
  introMessage: string;
  plainInviteHref: string;
  rowHref: (rating: number) => string;
  signatureBlock: string;
  removeBranding: boolean;
  businessName: string;
}): string {
  const {
    introMessage,
    plainInviteHref,
    rowHref,
    signatureBlock,
    removeBranding,
    businessName,
  } = opts;

  const introHtml = introMessage
    ? `<p style="font-size:15px;line-height:1.65;color:#333;margin:0 0 20px 0;">${esc(introMessage).replace(/\n/g, "<br/>")}</p>`
    : "";

  const heading = `<p style="margin:0 0 16px 0;font-size:18px;font-weight:700;color:#111111;text-decoration:underline;">How did we do?</p>`;

  const rowHtml: string[] = [];
  for (let r = 5; r >= 1; r--) {
    const href = esc(rowHref(r));
    const stars = buildEmailStarsRowForRating(r, { textAlign: "left" });
    rowHtml.push(`
      <tr>
        <td style="padding:0;border-bottom:1px solid #eeeeee;">
          <a href="${href}" style="display:block;text-decoration:none;color:inherit;padding:12px 14px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40" style="vertical-align:middle;padding-right:8px;">
                  <span style="display:inline-block;width:16px;height:16px;border:2px solid #D0D5DD;border-radius:50%;background:#ffffff;line-height:0;font-size:0;">&#8203;</span>
                </td>
                <td style="vertical-align:middle;">${stars}</td>
              </tr>
            </table>
          </a>
        </td>
      </tr>`);
  }

  const ladderTable = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e5e5e5;border-radius:6px;">
${rowHtml.join("")}
</table>`;

  const footerCopy = `
<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#555555;">
  Your experience matters to us. Whether your feedback is positive, mixed, or critical, it may appear on <strong style="color:#0E0E0E;">Tellacity</strong> to help others make more informed choices.
</p>
<p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#555555;">
  Thanks for your time,<br/><strong>${esc(businessName)}</strong>
</p>
<p style="margin:14px 0 0;font-size:12px;line-height:1.55;color:#888888;">
  Note: This message is sent automatically. If your order or service has not arrived yet, feel free to wait until it does before you write your review.
</p>`;

  const plainCta = `
<p style="margin:18px 0 0;text-align:center;">
  <a href="${esc(plainInviteHref)}" style="font-size:13px;color:${EMAIL_WIDGET_CTA_TEXT};text-decoration:underline;">Continue to review without tapping a row</a>
</p>`;

  const branding = removeBranding ? "" : buildBrandingLine();

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4f4f4;">
<div style="font-family:Arial,Helvetica,sans-serif;padding:24px 16px;background:#f4f4f4;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px 24px 32px;border:1px solid #e8e8e8;">
    ${introHtml}
    ${heading}
    ${ladderTable}
    ${footerCopy}
    ${plainCta}
    ${branding}
    ${signatureBlock}
  </div>
</div>
</body>
</html>`;
}

/** Table-based footer: text only (no icon , email-safe). */
function buildBrandingLine(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;"><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666666;">
<span style="white-space:nowrap;">Verified reviews powered by <strong style="color:#000000;">Tellacity</strong></span>
</td></tr></table>`;
}

function buildReviewHunterBrandingLine(appOrigin: string): string {
  const reviewHunterLogoUrl = esc(getTellacityTrustBadgeLogoUrl(appOrigin));
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-top:14px;">
  <tr>
    <td align="center" style="line-height:0;font-size:0;">
      <img src="${reviewHunterLogoUrl}" alt="Tellacity" style="display:block;max-height:12px;width:auto;height:auto;border:0;" />
    </td>
  </tr>
</table>`;
}

function buildWidgetHtml(opts: {
  introMessage: string;
  reviewLink: string;
  signatureBlock: string;
  removeBranding: boolean;
  appOrigin: string;
  brandingVariant?: "standard" | "review_hunter";
}): string {
  const {
    introMessage,
    reviewLink,
    signatureBlock,
    removeBranding,
    appOrigin,
    brandingVariant = "standard",
  } = opts;

  const introParagraph = introMessage
    ? `<p style="font-size:15px; line-height:1.6; color:#333; margin:0 0 20px 0;">${introMessage
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>")}</p>`
    : "";

  const brandingLine =
    removeBranding
      ? ""
      : brandingVariant === "review_hunter"
        ? buildReviewHunterBrandingLine(appOrigin)
        : buildBrandingLine();
  const reviewUsLogoUrl = esc(getTellacityTrustBadgeLogoUrl(appOrigin));

  /** Single-row CTA: “Review us on” + TELLACITY LOGO 1A (email-safe table layout). */
  const reviewUsBadge = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto 20px;">
  <tr>
    <td style="border:none;padding:0;background:transparent;">
      <a href="${esc(reviewLink)}" style="display:block; text-decoration:none; color:#111827; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.35; padding:4px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle; padding:0 10px 0 0; white-space:nowrap; font-weight:400;">Review us on</td>
            <td style="vertical-align:middle; line-height:0; font-size:0;">
              <img src="${reviewUsLogoUrl}" alt="Tellacity" style="display:block; max-height:20px; width:auto; max-width:178px; height:auto; border:0;" />
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>
</table>`;

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f8f8f8;">
<div style="font-family:Arial, sans-serif; padding:20px; background:#f8f8f8;">
  <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">
    ${introParagraph}
    ${reviewUsBadge}
    ${brandingLine}
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
 * Per recipient: creates `review_invites` (source = email_widget, excluded from monthly quota),
 * sends HTML with `/review/invite?token=…` links , same finalization UI as standard invites.
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

    const businessDisplayName = bizRecord.name ?? "";

    const effectivePlan = await getActivePlanKeyForBusiness(businessId, supabase);

    // Load widget template (template_key = 'widget')
    const { data: tmpl } = await supabase
      .from("review_invite_email_templates")
      .select(
        "subject, intro_message, layout_style, signature_enabled, signature_name, signature_title, signature_phone, signature_website, signature_logo_url, signature_address, signature_cta_text, signature_cta_url, remove_tellacity_branding"
      )
      .eq("business_id", businessId)
      .eq("template_key", "widget")
      .maybeSingle();

    const origin = getPublicAppOrigin();

    const t = (tmpl ?? {}) as Record<string, unknown>;

    const subject = t.subject
      ? String(t.subject).trim()
      : `Share your experience with ${businessDisplayName || "us"}`;

    const introMessage = t.intro_message
      ? String(t.intro_message).trim()
      : `We'd love to hear about your experience with ${businessDisplayName || "us"}. It only takes a minute.`;

    const signatureBlock = buildSignatureBlock(t);
    const removeBranding = Boolean(t.remove_tellacity_branding);

    let layoutStyle = String(t.layout_style ?? "standard");
    if (layoutStyle === "review_card" || layoutStyle === "tellacity_branded") {
      layoutStyle = "standard";
    }

    if (!planAllowsEmailWidgetSend(effectivePlan, layoutStyle)) {
      return NextResponse.json(
        {
          error:
            "This email widget layout is not available on your current plan. Choose a supported layout or upgrade.",
        },
        { status: 403 },
      );
    }

    const useRatingLadder =
      canUseCustomEmail(effectivePlan) && layoutStyle === "rating_ladder";
    const useEliteBranded =
      !useRatingLadder &&
      effectivePlan === "elite" &&
      layoutStyle === "elite_branded";
    const useReviewHunter =
      !useRatingLadder &&
      !useEliteBranded &&
      layoutStyle === "review_hunter";

    function buildEmailHtmlForToken(token: string): string {
      const inviteHref = getInviteFinalizeUrl(origin, token);
      if (useRatingLadder) {
        return buildRatingLadderHtml({
          introMessage,
          plainInviteHref: inviteHref,
          rowHref: (r: number) => getInviteFinalizeUrl(origin, token, r),
          signatureBlock,
          removeBranding,
          businessName: businessDisplayName,
        });
      }
      if (useEliteBranded) {
        return buildEliteBrandedHtml({
          introMessage,
          reviewLink: inviteHref,
          signatureBlock,
          businessName: businessDisplayName,
          businessLogoUrl: (bizRecord as Record<string, unknown>).logo_url as string | null,
        });
      }
      return buildWidgetHtml({
        introMessage,
        reviewLink: inviteHref,
        signatureBlock,
        removeBranding,
        appOrigin: origin,
        brandingVariant: useReviewHunter ? "review_hunter" : "standard",
      });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return NextResponse.json({ error: "Internal server error." }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const sendResults = await Promise.allSettled(
      validEmails.map(async (to) => {
        const created = await insertEmailWidgetInvite(supabase, businessId, to);
        if (!created.ok) {
          throw new Error(created.message);
        }
        const html = buildEmailHtmlForToken(created.token);
        return resend.emails.send({
          from: "Tellacity <notifications@tellacity.com>",
          to,
          subject,
          html,
        });
      }),
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
