export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { resolveReviewGuestEmail } from "@/lib/reviewSessionEmail";

type Body = {
  business_id?: string;
  guest_email?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  date_of_experience?: string | null;
};

const getEffectiveEmail = async (
  _req: Request,
  bodyEmail?: string,
): Promise<string> => {
  return resolveReviewGuestEmail(
    typeof bodyEmail === "string" ? bodyEmail.trim().toLowerCase() : "",
  );
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function rowIsPublicLiveReview(row: {
  draft?: boolean | null;
  status?: string | null;
  visibility?: string | null;
}): boolean {
  if (row.draft === true) return false;
  const st = row.status;
  if (st && st !== "published") return false;
  const vis = String(row.visibility ?? "visible").trim().toLowerCase();
  return vis === "visible";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const business_id =
      typeof body.business_id === "string" ? body.business_id.trim() : "";
    const effectiveEmail = await getEffectiveEmail(req, body.guest_email);
    const reviewBody =
      typeof body.body === "string" ? body.body.trim() : "";

    if (!isUuid(business_id) || !effectiveEmail.includes("@") || !reviewBody) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const ratingNum = Number(body.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    let date_of_experience: string | null = null;
    if (
      typeof body.date_of_experience === "string" &&
      body.date_of_experience.trim()
    ) {
      const d = body.date_of_experience.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const parsed = new Date(d);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      date_of_experience = d;
    }

    const titleVal =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : null;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: rows, error: findError } = await supabase
      .from("reviews")
      .select("id, draft, status, visibility, created_at")
      .eq("business_id", business_id)
      .eq("guest_email", effectiveEmail)
      .order("created_at", { ascending: false })
      .limit(25);

    if (findError) {
      console.error("UPDATE REVIEW find:", findError);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const list = rows ?? [];
    const existing = list.find((r) => rowIsPublicLiveReview(r));
    if (!existing?.id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        rating: Math.round(ratingNum),
        title: titleVal,
        body: reviewBody,
        date_of_experience,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("UPDATE REVIEW:", updateError);
      return NextResponse.json(
        { error: updateError.message || "update_failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("UPDATE REVIEW ERROR:", error);
    const message =
      error instanceof Error ? error.message : "update_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
