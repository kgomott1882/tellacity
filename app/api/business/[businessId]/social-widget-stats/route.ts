import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { data: biz, error: bErr } = await ctx.db
      .from("businesses")
      .select("slug")
      .eq("id", businessId)
      .maybeSingle();

    if (bErr) {
      console.error("[social-widget-stats] business", bErr);
      return NextResponse.json({ error: bErr.message }, { status: 500 });
    }

    if (!biz?.slug) {
      return NextResponse.json({ stats: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data: rpcData, error: rpcErr } = await ctx.db.rpc("get_widget_payload_v1", {
      p_business_slug: biz.slug,
      p_limit: 1,
    });

    if (rpcErr) {
      console.error("[social-widget-stats] rpc", rpcErr);
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    const raw = rpcData as Record<string, unknown> | null;
    if (!raw || raw.error) {
      return NextResponse.json({ stats: null }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      {
        stats: {
          business_name: String(raw.business_name ?? ""),
          avg_rating: Number(raw.avg_rating) || 0,
          review_count: Number(raw.review_count) || 0,
          logo_url: (raw.logo_url as string | null) ?? null,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[social-widget-stats]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
