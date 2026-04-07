import { NextResponse } from "next/server";
import {
  requireUserSession,
  canAccessBusiness,
} from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";

export async function POST(
  req: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json(
        { error: "Reply body is required." },
        { status: 400 }
      );
    }

    const auth = await requireUserSession(req);
    if (!auth.ok) return auth.response;

    const { db, userId } = auth;

    const { data: review, error: reviewError } = await db
      .from("reviews")
      .select("business_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      console.error("Review error:", reviewError);
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const allowed = await canAccessBusiness(db, userId, review.business_id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await db
      .from("reviews")
      .update({
        owner_response: body.trim(),
        owner_response_at: now,
      })
      .eq("id", reviewId)
      .select("id, owner_response, owner_response_at")
      .single();

    if (updateError) {
      console.error("[reply POST] update reviews", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    void logBusinessActivity({
      businessId: String(review.business_id),
      userId,
      action: "review_replied",
      metadata: { review_id: reviewId },
    });

    return NextResponse.json({
      success: true,
      review: {
        id: updated.id,
        owner_response: updated.owner_response,
        owner_response_at: updated.owner_response_at,
      },
    });
  } catch (err: unknown) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Reply body is required." }, { status: 400 });
    }

    const auth = await requireUserSession(req);
    if (!auth.ok) return auth.response;

    const { db, userId } = auth;

    const { data: review, error: revErr } = await db
      .from("reviews")
      .select("business_id")
      .eq("id", reviewId)
      .single();

    if (revErr || !review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const allowed = await canAccessBusiness(db, userId, review.business_id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await db
      .from("reviews")
      .update({
        owner_response: body.trim(),
        owner_response_at: now,
      })
      .eq("id", reviewId)
      .select("id, owner_response, owner_response_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;

    const auth = await requireUserSession(req);
    if (!auth.ok) return auth.response;

    const { db, userId } = auth;

    const { data: review, error: revErr } = await db
      .from("reviews")
      .select("business_id")
      .eq("id", reviewId)
      .single();

    if (revErr || !review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const allowed = await canAccessBusiness(db, userId, review.business_id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { error } = await db
      .from("reviews")
      .update({
        owner_response: null,
        owner_response_at: null,
      })
      .eq("id", reviewId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
