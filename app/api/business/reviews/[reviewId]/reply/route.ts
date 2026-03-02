import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request, { params }: any) {
  try {
    const { reviewId } = await params;
    const { body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json(
        { error: "Reply body is required." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing Authorization header." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Validate user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("business_id")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      console.error("Review error:", reviewError);
      return NextResponse.json(
        { error: "Review not found." },
        { status: 404 }
      );
    }

    // Verify ownership
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", review.business_id)
      .single();

    if (businessError || !business) {
      console.error("Business error:", businessError);
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 }
      );
    }

    // Insert reply
    const { data: reply, error: insertError } = await supabase
      .from("review_replies")
      .insert({
        review_id: reviewId,
        body: body.trim(),
        author_role: "business",
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reply: {
        id: reply.id,
        reviewId: reply.review_id,
        body: reply.body,
        createdAt: reply.created_at,
        authorRole: reply.author_role,
      },
    });

  } catch (err: any) {
    console.error("Unhandled error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ reviewId: string }> }) {
  try {
    const { reviewId } = await context.params;
    const { replyId, body } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: "Reply body is required." }, { status: 400 });
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

    const { data: reply, error } = await supabase
      .from("review_replies")
      .update({ body: body.trim() })
      .eq("id", replyId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, reply });

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
    const { replyId } = await req.json();

    if (!replyId) {
      return NextResponse.json({ error: "Reply ID required." }, { status: 400 });
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

    const { error } = await supabase
      .from("review_replies")
      .delete()
      .eq("id", replyId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
