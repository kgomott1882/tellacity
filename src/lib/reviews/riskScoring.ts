import type { SupabaseClient } from "@supabase/supabase-js";
import { emailsFromAuthUsersByIds } from "@/lib/reviewerEmailResolution";

/** Internal / seed reviewer emails excluded from cross-business email reuse checks. */
export const INTERNAL_SEED_EMAILS: string[] = [];

/** Domains that raise risk when combined with other signals (not inherently bad). */
export const WATCHED_EMAIL_DOMAINS: string[] = ["proton.me", "protonmail.com"];

export type ReviewRiskResult = {
  score: number;
  status: "low" | "medium" | "high";
  reasons: string[];
};

type ReviewRow = {
  id: string;
  business_id: string;
  user_id: string | null;
  guest_email: string | null;
  author_email: string | null;
  email: string | null;
  ip_address: string | null;
  invite_id: string | null;
  created_at: string;
};

function normalizeEmail(raw: string | null | undefined): string | null {
  const e = raw?.trim().toLowerCase();
  if (!e || !e.includes("@")) return null;
  return e;
}

function isInternalSeedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return INTERNAL_SEED_EMAILS.some((seed) => seed.toLowerCase() === lower);
}

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).toLowerCase();
}

function riskStatusFromScore(score: number): ReviewRiskResult["status"] {
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function parseReviewRiskReasons(
  raw: string | null | undefined,
): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).filter((s) => s.trim());
    }
  } catch {
    // fall through to plain-text split
  }
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function resolveReviewerEmail(
  supabase: SupabaseClient,
  review: ReviewRow,
): Promise<string | null> {
  const direct =
    normalizeEmail(review.author_email) ||
    normalizeEmail(review.guest_email) ||
    normalizeEmail(review.email);
  if (direct) return direct;

  if (review.user_id) {
    const map = await emailsFromAuthUsersByIds(supabase, [review.user_id]);
    return normalizeEmail(map.get(review.user_id) ?? null);
  }

  return null;
}

async function distinctBusinessIdsForEmail(
  supabase: SupabaseClient,
  email: string,
  userId: string | null,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: byStoredEmail, error: emailErr } = await supabase
    .from("reviews")
    .select("business_id")
    .or(
      `guest_email.eq.${email},author_email.eq.${email},email.eq.${email}`,
    );
  if (emailErr) {
    console.warn("[review risk] email business lookup", emailErr.message);
  } else {
    for (const row of byStoredEmail ?? []) {
      if (row.business_id) ids.add(String(row.business_id));
    }
  }

  if (userId) {
    const { data: byUser, error: userErr } = await supabase
      .from("reviews")
      .select("business_id")
      .eq("user_id", userId);
    if (userErr) {
      console.warn("[review risk] user business lookup", userErr.message);
    } else {
      for (const row of byUser ?? []) {
        if (row.business_id) ids.add(String(row.business_id));
      }
    }
  }

  return ids;
}

async function businessPublishedReviewStats(
  supabase: SupabaseClient,
  businessId: string,
): Promise<{ count: number; allFiveStars: boolean }> {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("business_id", businessId)
    .or("status.is.null,status.eq.published");

  if (error) {
    console.warn("[review risk] business review stats", error.message);
    return { count: 0, allFiveStars: false };
  }

  const ratings = (data ?? [])
    .map((r) => Number((r as { rating?: number }).rating))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 5);

  if (ratings.length === 0) {
    return { count: 0, allFiveStars: false };
  }

  return {
    count: ratings.length,
    allFiveStars: ratings.every((n) => n === 5),
  };
}

/**
 * Compute fraud risk for a review (0–100) from stored signals.
 */
export async function calculateReviewRisk(
  supabase: SupabaseClient,
  reviewId: string,
): Promise<ReviewRiskResult> {
  const { data: review, error } = await supabase
    .from("reviews")
    .select(
      "id, business_id, user_id, guest_email, author_email, email, ip_address, invite_id, created_at",
    )
    .eq("id", reviewId)
    .maybeSingle();

  if (error || !review) {
    throw new Error(error?.message ?? `Review not found: ${reviewId}`);
  }

  const row = review as ReviewRow;
  const reasons: string[] = [];
  let score = 0;

  const ip =
    typeof row.ip_address === "string" && row.ip_address.trim()
      ? row.ip_address.trim()
      : null;

  // 1. IP reuse across businesses (+30)
  if (ip) {
    const { data: ipReuse, error: ipErr } = await supabase
      .from("reviews")
      .select("id")
      .eq("ip_address", ip)
      .neq("business_id", row.business_id)
      .neq("id", reviewId)
      .limit(1);
    if (ipErr) {
      console.warn("[review risk] ip reuse lookup", ipErr.message);
    } else if ((ipReuse ?? []).length > 0) {
      score += 30;
      reasons.push("IP address also used on a review for another business");
    }
  }

  const reviewerEmail = await resolveReviewerEmail(supabase, row);

  // 2. Email reuse across businesses (+30)
  if (reviewerEmail && !isInternalSeedEmail(reviewerEmail)) {
    const businessIds = await distinctBusinessIdsForEmail(
      supabase,
      reviewerEmail,
      row.user_id,
    );
    if (businessIds.size > 1) {
      score += 30;
      const otherCount = businessIds.size - 1;
      reasons.push(
        `Reviewer email also used on ${otherCount} other business${otherCount === 1 ? "" : "es"}`,
      );
    }
  }

  // 3. Rapid successive reviews within 24h on another business (+25)
  const createdAt = new Date(row.created_at);
  if (!Number.isNaN(createdAt.getTime())) {
    const windowStart = new Date(
      createdAt.getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const windowEnd = createdAt.toISOString();

    let rapidHit = false;

    if (ip) {
      const { data: rapidByIp } = await supabase
        .from("reviews")
        .select("id")
        .eq("ip_address", ip)
        .neq("id", reviewId)
        .neq("business_id", row.business_id)
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .limit(1);
      rapidHit = (rapidByIp ?? []).length > 0;
    }

    if (!rapidHit && reviewerEmail) {
      const orParts = [
        `guest_email.eq.${reviewerEmail}`,
        `author_email.eq.${reviewerEmail}`,
        `email.eq.${reviewerEmail}`,
      ];
      const { data: rapidByEmail } = await supabase
        .from("reviews")
        .select("id")
        .neq("id", reviewId)
        .neq("business_id", row.business_id)
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .or(orParts.join(","))
        .limit(1);
      rapidHit = (rapidByEmail ?? []).length > 0;
    }

    if (!rapidHit && row.user_id) {
      const { data: rapidByUser } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", row.user_id)
        .neq("id", reviewId)
        .neq("business_id", row.business_id)
        .gte("created_at", windowStart)
        .lte("created_at", windowEnd)
        .limit(1);
      rapidHit = (rapidByUser ?? []).length > 0;
    }

    if (rapidHit) {
      score += 25;
      reasons.push(
        "Same reviewer email or IP left another review within 24 hours on a different business",
      );
    }
  }

  // 4. No invite on a business with fewer than 5 reviews (+10)
  if (!row.invite_id) {
    const stats = await businessPublishedReviewStats(supabase, row.business_id);
    if (stats.count < 5) {
      score += 10;
      reasons.push(
        "Direct submission without invite on a business with fewer than 5 reviews",
      );
    }
  }

  // 5. Perfect 5-star pattern (+15)
  const bizStats = await businessPublishedReviewStats(supabase, row.business_id);
  if (bizStats.count >= 3 && bizStats.allFiveStars) {
    score += 15;
    reasons.push(
      "Business has only 5-star reviews with 3 or more published reviews",
    );
  }

  // 6. Watched email domain (+10)
  if (reviewerEmail) {
    const domain = emailDomain(reviewerEmail);
    if (
      domain &&
      WATCHED_EMAIL_DOMAINS.some((d) => d.toLowerCase() === domain)
    ) {
      score += 10;
      reasons.push(`Reviewer email uses watched domain (${domain})`);
    }
  }

  const capped = Math.min(100, score);
  return {
    score: capped,
    status: riskStatusFromScore(capped),
    reasons,
  };
}
