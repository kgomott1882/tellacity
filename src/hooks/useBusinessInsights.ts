"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Insights = {
  total_reviews: number;
  avg_rating: number;
  rating_distribution: Record<string, number>;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  reviews_90d: number;
  review_velocity_percent: number;
  total_invites: number;
  invites_last_30: number;
  invites_90d: number;
  invite_conversion_percent: number;
  trust_score: number;
  reputation_status: string;
  trend: {
    last_30: number;
    prev_30: number;
    percent_change: number;
    direction: "up" | "down" | "flat";
  } | null;
};

const DEFAULTS: Insights = {
  total_reviews: 0,
  avg_rating: 0,
  rating_distribution: {},
  sentiment: {
    positive: 0,
    neutral: 0,
    negative: 0,
  },
  reviews_90d: 0,
  review_velocity_percent: 0,
  total_invites: 0,
  invites_last_30: 0,
  invites_90d: 0,
  invite_conversion_percent: 0,
  trust_score: 0,
  reputation_status: "Needs Attention",
  trend: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(row: any): Insights {
  return {
    total_reviews:             Number(row?.total_reviews             ?? 0),
    avg_rating:                Number(row?.avg_rating                ?? 0),
    rating_distribution:       row?.rating_distribution              ?? {},
    sentiment: {
      positive: Number(row?.sentiment?.positive ?? 0),
      neutral:  Number(row?.sentiment?.neutral  ?? 0),
      negative: Number(row?.sentiment?.negative ?? 0),
    },
    reviews_90d:               Number(row?.reviews_90d               ?? 0),
    review_velocity_percent:   Number(row?.review_velocity_percent   ?? 0),
    total_invites:             Number(row?.total_invites             ?? 0),
    invites_last_30:           Number(row?.invites_last_30           ?? 0),
    invites_90d:               Number(row?.invites_90d               ?? 0),
    invite_conversion_percent: Number(row?.invite_conversion_percent ?? 0),
    trust_score:               Number(row?.trust_score               ?? 0),
    reputation_status:         String(row?.reputation_status         ?? "Needs Attention"),
    trend: row?.trend
      ? {
          last_30:        Number(row.trend.last_30        ?? 0),
          prev_30:        Number(row.trend.prev_30        ?? 0),
          percent_change: Number(row.trend.percent_change ?? 0),
          direction:      (row.trend.direction ?? "flat") as "up" | "down" | "flat",
        }
      : null,
  };
}

export function useBusinessInsights(businessId: string | null) {
  const [data,    setData]    = useState<Insights>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!businessId) {
      setData(DEFAULTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { data: row, error: rpcError } = await supabase.rpc(
      "get_business_review_insights",
      { p_business_id: businessId }
    );

    if (rpcError) {
      console.error("[useBusinessInsights RPC error]", rpcError.message);
      setError(rpcError.message);
      setData(DEFAULTS);
      setLoading(false);
      return;
    }

    setData(normalise(row));
    setLoading(false);
  }, [businessId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    data,
    loading,
    error,
    refetch: fetchInsights,
  };
}
