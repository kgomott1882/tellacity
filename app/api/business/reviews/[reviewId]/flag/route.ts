import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  requireUserSession,
  canAccessBusiness,
} from "@/lib/supabase/businessDashboardServer";

export async function POST(
  req: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const { reason } = await req.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Reason required." }, { status: 400 });
    }

    const auth = await requireUserSession(req);
    if (!auth.ok) return auth.response;

    const { db, userId } = auth;

    const { data: review } = await db
      .from("reviews")
      .select("id, body, business_id")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const allowed = await canAccessBusiness(db, userId, review.business_id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: existingFlag } = await db
      .from("review_flags")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingFlag) {
      return NextResponse.json(
        { error: "This review is already flagged and under review." },
        { status: 409 }
      );
    }

    const { error: insertErr } = await db.from("review_flags").insert({
      review_id: reviewId,
      user_id: userId,
      reason: reason.trim(),
    });

    if (insertErr) {
      console.error("[flag] insert", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: "notifications@tellacity.com",
      to: "support@tellacity.com",
      subject: "Business flagged a review",
      html: `
        <h3>Review Flagged</h3>
        <p><strong>Review ID:</strong> ${reviewId}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Review Content:</strong></p>
        <blockquote>${review.body}</blockquote>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Flag error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
