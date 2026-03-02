import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

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

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: review } = await supabase
      .from("reviews")
      .select("id, body, business_id")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    // Check if already flagged
    const { data: existingFlag } = await supabase
      .from("review_flags")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", user.id)
      .single();

    if (existingFlag) {
      return NextResponse.json(
        { error: "This review is already flagged and under review." },
        { status: 409 }
      );
    }

    // Insert flag record
    await supabase
      .from("review_flags")
      .insert({
        review_id: reviewId,
        user_id: user.id,
        reason: reason.trim(),
      });

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
      `
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Flag error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
