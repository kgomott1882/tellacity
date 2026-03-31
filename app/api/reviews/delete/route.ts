export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

type Body = {
  review_id?: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const reviewId =
      typeof body.review_id === "string" ? body.review_id.trim() : "";
    if (!isUuid(reviewId)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabaseServer = await createSupabaseServerCookies();
    const {
      data: { user },
      error: userErr,
    } = await supabaseServer.auth.getUser();

    if (userErr || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = (user.email ?? "").trim().toLowerCase();
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: reviewRow, error: reviewErr } = await admin
      .from("reviews")
      .select("id, guest_email, user_id")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewErr || !reviewRow) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const ownerByUserId =
      reviewRow.user_id != null && String(reviewRow.user_id) === user.id;
    const ownerByEmail =
      userEmail.length > 0 &&
      String(reviewRow.guest_email ?? "").trim().toLowerCase() === userEmail;

    if (!ownerByUserId && !ownerByEmail) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: delErr } = await admin.from("reviews").delete().eq("id", reviewId);
    if (delErr) {
      return NextResponse.json({ error: "Unable to delete review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}

