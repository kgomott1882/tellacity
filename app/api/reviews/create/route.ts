export const runtime = "nodejs";

import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { logReviewReceivedActivity } from "@/lib/logBusinessActivity";

function reviewerDisplayNameFromAuthUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const email = (user.email ?? "").trim();
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    "";
  if (fromMeta) return fromMeta.slice(0, 200);
  if (email.includes("@")) {
    return email.split("@")[0]!.slice(0, 200);
  }
  return "Anonymous";
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(req: Request) {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data, error: authError } = await supabase.auth.getUser(token);

    if (authError || !data.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = data.user;

    const {
      business_id: rawBusinessId,
      rating: rawRating,
      title: rawTitle,
      body: rawBody,
      date_of_experience: rawDate,
    } = (await req.json()) as {
      business_id?: string;
      rating?: number;
      title?: string | null;
      body?: string;
      date_of_experience?: string | null;
    };

    const business_id =
      typeof rawBusinessId === "string" ? rawBusinessId.trim() : "";
    if (!isUuid(business_id)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ratingNum = Number(rawRating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const body =
      typeof rawBody === "string" ? rawBody.trim() : "";
    if (!body) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let date_of_experience: string | null = null;
    if (
      typeof rawDate === "string" &&
      rawDate.trim()
    ) {
      const d = rawDate.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const parsed = new Date(d);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      date_of_experience = d;
    }

    const title =
      typeof rawTitle === "string" && rawTitle.trim()
        ? rawTitle.trim()
        : null;

    const rating = Math.round(ratingNum);
    const guest_name = reviewerDisplayNameFromAuthUser(user);

    const { data: createdRow, error: insertError } = await supabase
      .from("reviews")
      .insert({
        business_id,
        user_id: user.id,
        guest_name,
        rating,
        title,
        body,
        date_of_experience,
        status: "published",
        visibility: "visible",
        verification_status: "verified",
        draft: false,
        imported: false,
        is_flagged: false,
      })
      .select("id, business_id, user_id, rating")
      .single();

    if (insertError) {
      // Handle duplicate review cleanly
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this business." },
          { status: 409 },
        );
      }

      console.error("Create review error:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to submit review" },
        { status: 400 },
      );
    }

    if (createdRow?.id && createdRow.business_id != null) {
      const r = createdRow as {
        id: string;
        business_id: string;
        user_id: string | null;
        rating: number;
      };
      void logReviewReceivedActivity({
        businessId: r.business_id,
        userId: r.user_id,
        reviewId: r.id,
        rating: r.rating,
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Create review error:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
