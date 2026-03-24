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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeInsights(raw: any) {
  let data = raw;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
    }
  }

  if (Array.isArray(data)) {
    data = data[0] ?? {};
  }

  if (!data || typeof data !== "object") {
    data = {};
  }

  const num = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  return {
    avg_rating: num(data.avg_rating),
    total_reviews: num(data.total_reviews),
    trust_score: num(data.trust_score),
    review_velocity_percent: num(data.review_velocity_percent),
    reviews_90d: num(data.reviews_90d),

    rating_distribution:
      typeof data.rating_distribution === "object" && data.rating_distribution !== null
        ? data.rating_distribution
        : {},

    sentiment:
      typeof data.sentiment === "object" && data.sentiment !== null
        ? {
            positive: num(data.sentiment.positive),
            neutral: num(data.sentiment.neutral),
            negative: num(data.sentiment.negative),
          }
        : { positive: 0, neutral: 0, negative: 0 },

    trend: data.trend ?? null,
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

      setData(normalizeInsights(json.insights));
      setReviews(json.recentReviews ?? []);

      const dailyMap = new Map<string, number>();
      for (const row of json.reviews90d ?? []) {
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
