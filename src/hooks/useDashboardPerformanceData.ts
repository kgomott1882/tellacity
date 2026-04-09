"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";

export type DailyReview = { review_date: string; review_count: number };
export type RecentReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  guest_name: string | null;
};
export type MonthlyInvite = { date: string; value: number };

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

type TrendPayload = {
  last_30: number;
  prev_30: number;
  percent_change: number;
  direction: "up" | "down" | "flat";
} | null;

function parseTrend(raw: unknown): TrendPayload {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const dir = String(o.direction ?? "flat");
  const direction: "up" | "down" | "flat" =
    dir === "up" || dir === "down" || dir === "flat" ? dir : "flat";
  return {
    last_30: num(o.last_30),
    prev_30: num(o.prev_30),
    percent_change: num(o.percent_change),
    direction,
  };
}

/**
 * Client-side trust index (0–100): rating quality + log volume + review-count momentum.
 * Does not use RPC `trust_score` , single source of truth for the Performance dashboard.
 */
export function computeTrustScore(averageRating: number, totalReviews: number): number {
  const avg = Math.max(0, Math.min(5, averageRating));
  const count = Math.max(0, totalReviews);

  const ratingScore = (avg / 5) * 60;
  const volumeScore = Math.log(count + 1) * 10;

  let velocityScore = 0;
  if (count >= 5) velocityScore = 30;
  else if (count >= 2) velocityScore = 15;
  else velocityScore = 0;

  const trustScoreRaw = ratingScore + volumeScore + velocityScore;
  return Math.min(100, Math.round(trustScoreRaw));
}

/** Percentages (0–100) from rating distribution , not RPC `sentiment` counts. */
export type SentimentPercent = { positive: number; neutral: number; negative: number };

function bucketCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw && typeof raw === "object" && raw !== null && "count" in raw) {
    return num((raw as { count: unknown }).count);
  }
  return 0;
}

/**
 * Derives sentiment from distribution: array `{ rating, count }` or object `{ "1": n, ... }`.
 * Positive = 4–5★, neutral = 3★, negative = 1–2★.
 */
export function computeSentimentFromDistribution(
  distribution: Record<string, unknown> | unknown[] | null | undefined
): SentimentPercent {
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let total = 0;

  if (Array.isArray(distribution)) {
    for (const item of distribution) {
      if (!item || typeof item !== "object") continue;
      const row = item as { rating?: unknown; star?: unknown; count?: unknown; cnt?: unknown };
      const rating = num(row.rating ?? row.star);
      const count = num(row.count ?? row.cnt);
      total += count;
      if (rating >= 4) positive += count;
      else if (rating === 3) neutral += count;
      else negative += count;
    }
  } else if (distribution && typeof distribution === "object") {
    const d = distribution as Record<string, unknown>;
    for (const star of [1, 2, 3, 4, 5] as const) {
      const c = bucketCount(d[String(star)]);
      total += c;
      if (star >= 4) positive += c;
      else if (star === 3) neutral += c;
      else negative += c;
    }
  }

  return {
    positive: total ? Math.round((positive / total) * 100) : 0,
    neutral: total ? Math.round((neutral / total) * 100) : 0,
    negative: total ? Math.round((negative / total) * 100) : 0,
  };
}

/**
 * Compares review counts: last 30 days vs the prior 30 days (days 31–60 ago).
 * Uses `created_at` from the performance API review list , not RPC `review_velocity_percent`.
 */
export function computeReviewVelocityPercent(reviewRows: { created_at: string }[]): number {
  const now = new Date();
  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);

  const prev30Days = new Date(now);
  prev30Days.setDate(now.getDate() - 60);

  let recent = 0;
  let previous = 0;

  for (const review of reviewRows) {
    const date = new Date(review.created_at);
    if (Number.isNaN(date.getTime())) continue;

    if (date >= last30Days) {
      recent++;
    } else if (date >= prev30Days) {
      previous++;
    }
  }

  if (previous === 0 && recent > 0) return 100;
  if (previous === 0) return 0;
  return Math.round(((recent - previous) / previous) * 100);
}

/**
 * RPC `get_business_review_insights` returns jsonb; PostgREST may deliver an object,
 * a one-element array, or (rarely) a JSON string. Also support alias field names.
 */
function normalizeInsights(raw: unknown) {
  let data: unknown = raw;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
    }
  }

  const insights = Array.isArray(data) ? data[0] : data;

  if (!insights || typeof insights !== "object") {
    const zeros = {
      avg_rating: 0,
      averageRating: 0,
      total_reviews: 0,
      totalReviews: 0,
      trust_score: 0,
      review_velocity_percent: 0,
      reviews_90d: 0,
      rating_distribution: {} as Record<string, unknown>,
      distribution: {} as Record<string, unknown>,
      sentiment: { positive: 0, neutral: 0, negative: 0 } satisfies SentimentPercent,
      trend: null,
    };
    return zeros;
  }

  const src = insights as Record<string, unknown>;

  const avg_rating = num(src.avg_rating ?? src.average_rating);
  const total_reviews = num(src.total_reviews);

  let rating_distribution: Record<string, unknown> = {};
  const dist = src.distribution ?? src.rating_distribution;

  if (Array.isArray(dist)) {
    for (const row of dist) {
      if (row && typeof row === "object") {
        const r = row as { rating?: unknown; star?: unknown; count?: unknown; cnt?: unknown };
        const key = String(r.rating ?? r.star ?? "");
        if (key) {
          rating_distribution[key] = num(r.count ?? r.cnt);
        }
      }
    }
  } else if (dist && typeof dist === "object") {
    rating_distribution = dist as Record<string, unknown>;
  }

  const sentiment = computeSentimentFromDistribution(
    Array.isArray(dist) ? dist : rating_distribution
  );

  const trust_score = computeTrustScore(avg_rating, total_reviews);

  return {
    avg_rating,
    averageRating: avg_rating,
    total_reviews,
    totalReviews: total_reviews,
    trust_score,
    review_velocity_percent: 0,
    reviews_90d: num(src.reviews_90d),
    rating_distribution,
    distribution: rating_distribution,
    sentiment,
    trend: parseTrend(src.trend),
  };
}

export type DashboardPerformanceInsights = ReturnType<typeof normalizeInsights>;

type PerformanceApiJson = {
  insights?: unknown;
  reviews90d?: { created_at: string }[];
  recentReviews?: RecentReview[];
  totalInvites?: number;
  invites30?: number;
  inviteRows3m?: { created_at: string }[];
};

/**
 * Loads Performance dashboard data via a Next.js Route Handler (cookies first).
 * Review KPIs (totals, average, distribution, trust, sentiment) come only from
 * `get_business_review_insights` via `json.insights` , not derived from `recentReviews.length`.
 */
export function useDashboardPerformanceData(businessId: string | null) {
  const [data, setData] = useState<DashboardPerformanceInsights | null>(null);
  const [daily, setDaily] = useState<DailyReview[]>([]);
  const [reviews, setReviews] = useState<RecentReview[]>([]);
  const [inviteChart, setInviteChart] = useState<MonthlyInvite[]>([]);
  const [realTotalInvites, setRealTotalInvites] = useState(0);
  const [realInvites30, setRealInvites30] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGenRef = useRef(0);

  const load = useCallback(async () => {
    if (!businessId) {
      loadGenRef.current += 1;
      setData(null);
      setDaily([]);
      setReviews([]);
      setInviteChart([]);
      setRealTotalInvites(0);
      setRealInvites30(0);
      setError(null);
      setLoading(false);
      return;
    }

    const gen = ++loadGenRef.current;

    try {
      setLoading(true);
      setError(null);

      const json = await dashboardApiGet<PerformanceApiJson>(
        `/api/business/${encodeURIComponent(businessId)}/performance-data`
      );

      if (gen !== loadGenRef.current) return;

      const rows = json.reviews90d ?? [];
      const insightsMerged = {
        ...normalizeInsights(json.insights),
        review_velocity_percent: computeReviewVelocityPercent(rows),
      };
      setData(insightsMerged);
      setReviews(json.recentReviews ?? []);

      const dailyMap = new Map<string, number>();
      for (const row of rows) {
        const key = row.created_at.slice(0, 10);
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
      }
      setDaily(
        Array.from(dailyMap.entries()).map(([review_date, review_count]) => ({
          review_date,
          review_count,
        }))
      );

      setRealTotalInvites(json.totalInvites ?? 0);
      setRealInvites30(json.invites30 ?? 0);

      const now = new Date();
      const monthBuckets = [2, 1, 0].map((offset) => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString("default", { month: "short" }),
          value: 0,
        };
      });

      for (const row of json.inviteRows3m ?? []) {
        const d = new Date(row.created_at);
        const bucket = monthBuckets.find(
          (b) => b.year === d.getFullYear() && b.month === d.getMonth() + 1
        );
        if (bucket) bucket.value += 1;
      }
      setInviteChart(monthBuckets.map(({ label, value }) => ({ date: label, value })));
    } catch (e) {
      if (gen !== loadGenRef.current) return;
      console.error("[useDashboardPerformanceData]", e);
      setError(e instanceof Error ? e.message : "Failed to load performance data");
      setData(null);
    } finally {
      if (gen === loadGenRef.current) {
        setLoading(false);
      }
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    data,
    error,
    loading,
    refetch: load,
    daily,
    reviews,
    inviteChart,
    realTotalInvites,
    realInvites30,
  };
}
