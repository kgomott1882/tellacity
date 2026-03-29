import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { getServerEnv } from "@/lib/serverEnv";

/**
 * Performance dashboard payload on the server.
 * - Prefers session from cookies (Next.js + Supabase SSR).
 * - If `Authorization: Bearer <access_token>` is sent (browser session in memory), uses that JWT
 *   for all queries so refresh works even when auth cookies are not synced yet.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { db: dataClient } = ctx;

    let inviteDb: SupabaseClient = dataClient;
    try {
      const { supabaseUrl, serviceRoleKey } = getServerEnv();
      inviteDb = createClient(supabaseUrl, serviceRoleKey);
    } catch {
      /* fall back to user-scoped client if service key missing (e.g. local stub) */
    }

    const since90dUTC = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate() - 89
      )
    ).toISOString();

    const startOf30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const now = new Date();
    const since3m = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();

    const [
      rpcRes,
      rawReviewsRes,
      revRes,
      totalInvRes,
      inv30Res,
      inv3mRes,
    ] = await Promise.all([
      dataClient.rpc("get_business_review_insights", { p_business_id: businessId }),
      dataClient
        .from("reviews")
        .select("created_at")
        .eq("business_id", businessId)
        .in("status", ["published", "approved"])
        .gte("created_at", since90dUTC)
        .order("created_at", { ascending: true }),
      dataClient
        .from("reviews")
        .select("id,rating,title,body,created_at,guest_name")
        .eq("business_id", businessId)
        .in("status", ["published", "approved"])
        .order("created_at", { ascending: false })
        .limit(2),
      inviteDb
        .from("review_invites")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId),
      inviteDb
        .from("review_invites")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId)
        .gte("created_at", startOf30d),
      inviteDb
        .from("review_invites")
        .select("created_at")
        .eq("business_id", businessId)
        .gte("created_at", since3m),
    ]);

    if (rpcRes.error) {
      console.error("[performance-data] RPC", rpcRes.error);
      return NextResponse.json({ error: rpcRes.error.message }, { status: 500 });
    }

    const rawInsights = rpcRes.data;
    const insightsNormalized = Array.isArray(rawInsights)
      ? rawInsights[0] ?? null
      : rawInsights;

    return NextResponse.json(
      {
        insights: insightsNormalized,
        reviews90d: rawReviewsRes.data ?? [],
        recentReviews: revRes.data ?? [],
        totalInvites: totalInvRes.count ?? 0,
        invites30: inv30Res.count ?? 0,
        inviteRows3m: inv3mRes.data ?? [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[performance-data]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
