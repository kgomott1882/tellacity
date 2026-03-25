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

    const { db, userId } = ctx;

    const { data: reviews, error: revErr } = await db
      .from("reviews")
      .select(
        "id, guest_name, rating, title, body, created_at, reference_number, owner_response, owner_response_at"
      )
      .eq("business_id", businessId)
      .eq("status", "published")
      .eq("visibility", "visible")
      .order("created_at", { ascending: false });

    if (revErr) {
      console.error("[manage-reviews-data] reviews", revErr);
      return NextResponse.json({ error: revErr.message }, { status: 500 });
    }

    const list = reviews ?? [];
    const replies: { id: string; review_id: string; body: string; created_at: string }[] = [];

    const { data: flaggedData, error: flagErr } = await db
      .from("review_flags")
      .select("review_id, status")
      .eq("user_id", userId);

    const flaggedReviews: Record<string, string> = {};
    if (!flagErr && flaggedData) {
      for (const f of flaggedData) {
        flaggedReviews[f.review_id] = f.status;
      }
    }

    return NextResponse.json(
      { reviews: list, replies, flaggedReviews },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[manage-reviews-data]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
