import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { normalizeBusinessIdKey } from "@/lib/normalizeBusinessId";

const MAX_IDS = 300;
const CHUNK = 80;

type AggregateRow = {
  business_id: string;
  review_count: number | null;
  average_rating: number | null;
};

async function loadAggregatesChunk(
  supabase: SupabaseClient,
  chunk: string[]
): Promise<Record<string, { review_count: number; trust_score: number }>> {
  const local: Record<string, { review_count: number; trust_score: number }> =
    {};

  // DB RPC exists in Postgres; generated Supabase types may omit args — keep runtime payload.
  const { data, error } = await supabase.rpc("get_public_review_aggregates", {
    p_business_ids: chunk,
  } as never);

  if (!error && data) {
    for (const row of (data ?? []) as AggregateRow[]) {
      if (!row.business_id) continue;
      const key = normalizeBusinessIdKey(row.business_id);
      local[key] = {
        review_count: Number(row.review_count ?? 0) || 0,
        trust_score: Number(row.average_rating ?? 0) || 0,
      };
    }
    return local;
  }

  if (error) {
    console.warn(
      "[home-best-in-metrics] RPC:",
      error.message,
      "(trying metrics view)"
    );
  }

  const { data: rows, error: err2 } = await supabase
    .from("business_review_metrics_v")
    .select("business_id, review_count, average_rating")
    .in("business_id", chunk);

  if (err2) {
    console.error("[home-best-in-metrics] view:", err2.message);
    return local;
  }

  for (const row of rows ?? []) {
    const r = row as AggregateRow;
    if (!r.business_id) continue;
    const key = normalizeBusinessIdKey(r.business_id);
    local[key] = {
      review_count: Number(r.review_count ?? 0) || 0,
      trust_score: Number(r.average_rating ?? 0) || 0,
    };
  }
  return local;
}

/**
 * Batch public aggregates for homepage "Best in" cards.
 * Uses RPC `get_public_review_aggregates` (same rules as home_feed reviews) with POST body
 * so long `?ids=` URLs cannot truncate the request.
 */
async function loadAggregates(
  supabase: SupabaseClient,
  ids: string[]
): Promise<Record<string, { review_count: number; trust_score: number }>> {
  const out: Record<string, { review_count: number; trust_score: number }> =
    {};

  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const part = await loadAggregatesChunk(supabase, chunk);
    Object.assign(out, part);
  }

  return out;
}

export async function POST(req: Request) {
  try {
    let ids: string[] = [];
    try {
      const body = (await req.json()) as { ids?: unknown };
      if (Array.isArray(body.ids)) {
        ids = body.ids
          .map((x) => String(x ?? "").trim())
          .filter(Boolean)
          .slice(0, MAX_IDS);
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    if (ids.length === 0) {
      return NextResponse.json(
        {},
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const out = await loadAggregates(supabase, ids);

    return NextResponse.json(out, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    console.error("[home-best-in-metrics] POST unhandled:", e);
    return NextResponse.json(
      { error: "Unexpected server error." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  }
}

/** @deprecated Prefer POST — long id lists exceed query string limits. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = url.searchParams.get("ids") ?? "";
    const ids = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_IDS);

    if (ids.length === 0) {
      return NextResponse.json(
        {},
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const out = await loadAggregates(supabase, ids);

    return NextResponse.json(out, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    });
  } catch (e) {
    console.error("[home-best-in-metrics] GET unhandled:", e);
    return NextResponse.json(
      { error: "Unexpected server error." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  }
}
