import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/serverEnv";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bodySnippet120(body: string | null | undefined): string {
  const t = (body ?? "").trim();
  if (t.length <= 120) return t;
  return t.slice(0, 120);
}

/**
 * Sends a transactional email to the claimed business owner when a new review is published.
 * Never throws — failures are logged only.
 */
export async function notifyBusinessOwnerOfNewReview({
  businessId,
  reviewId,
  rating,
}: {
  businessId: string;
  reviewId: string;
  rating: number;
}): Promise<void> {
  try {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "Tellacity <notifications@tellacity.com>";
    if (!apiKey) {
      console.warn(
        "[notifyBusinessOwnerNewReview] RESEND_API_KEY missing; skipping.",
      );
      return;
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id, name, owner_id")
      .eq("id", businessId)
      .maybeSingle();

    if (bizErr || !biz) {
      return;
    }

    let ownerUserId: string | null =
      biz.owner_id != null ? String(biz.owner_id).trim() : null;

    if (!ownerUserId) {
      const { data: bo } = await supabase
        .from("business_owners")
        .select("owner_user_id")
        .eq("business_id", businessId)
        .maybeSingle();
      const uid =
        bo?.owner_user_id != null ? String(bo.owner_user_id).trim() : "";
      ownerUserId = uid || null;
    }

    if (!ownerUserId) {
      return;
    }

    let toEmail: string | null = null;
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("email")
      .eq("id", ownerUserId)
      .maybeSingle();

    const bpEmail =
      typeof bp?.email === "string" ? bp.email.trim().toLowerCase() : "";
    if (bpEmail.includes("@")) {
      toEmail = bpEmail;
    }

    if (!toEmail) {
      const { data: userRes, error: userErr } =
        await supabase.auth.admin.getUserById(ownerUserId);
      if (!userErr && userRes?.user?.email?.trim()) {
        toEmail = userRes.user.email.trim().toLowerCase();
      }
    }

    if (!toEmail || !toEmail.includes("@")) {
      console.warn(
        "[notifyBusinessOwnerNewReview] No owner email for business",
        businessId,
        "owner",
        ownerUserId,
      );
      return;
    }

    const { data: review, error: revErr } = await supabase
      .from("reviews")
      .select("rating, title, body, guest_name")
      .eq("id", reviewId)
      .maybeSingle();

    if (revErr || !review) {
      return;
    }

    const businessName =
      typeof biz.name === "string" && biz.name.trim()
        ? biz.name.trim()
        : "Your business";

    const guest =
      typeof review.guest_name === "string" && review.guest_name.trim()
        ? review.guest_name.trim()
        : "Anonymous";

    const snippet = bodySnippet120(
      typeof review.body === "string" ? review.body : null,
    );

    const ratingNum = Number(review.rating ?? rating);
    const stars =
      Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5
        ? ratingNum
        : Math.round(rating);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const manageUrl = appUrl
      ? `${appUrl}/business/dashboard/manage-reviews`
      : "/business/dashboard/manage-reviews";

    const resend = new Resend(apiKey);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#F8F4F0;font-family:system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F8F4F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;padding:32px;">
          <tr><td style="font-size:20px;font-weight:600;color:#0E0E0E;">New customer review</td></tr>
          <tr><td style="padding-top:16px;font-size:15px;line-height:1.6;color:#404040;">
            You have a new <strong>${stars}★</strong> review for <strong>${escapeHtml(businessName)}</strong>.
          </td></tr>
          <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#404040;">
            <strong>Reviewer:</strong> ${escapeHtml(guest)}
          </td></tr>
          ${
            snippet
              ? `<tr><td style="padding-top:12px;font-size:14px;line-height:1.6;color:#555;border-left:3px solid #1FAF9E;padding-left:12px;">
            ${escapeHtml(snippet)}
          </td></tr>`
              : ""
          }
          <tr><td style="padding-top:28px;">
            <a href="${escapeHtml(manageUrl)}" style="display:inline-block;background:#1FAF9E;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:9999px;">View in dashboard</a>
          </td></tr>
          <tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#888;">
            You&apos;re receiving this because your business is claimed on Tellacity.
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    const result = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New ${stars}★ review for ${businessName}`,
      html,
    });

    if (result.error) {
      console.error(
        "[notifyBusinessOwnerNewReview] Resend:",
        result.error.message ?? result.error,
      );
    }
  } catch (e) {
    console.error("[notifyBusinessOwnerNewReview]", e);
  }
}
