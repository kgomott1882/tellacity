export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { resolveReviewGuestEmail } from "@/lib/reviewSessionEmail";

type Body = {
  business_id?: string;
  guest_email?: string;
  auth_mode?: string;
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
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length).trim()
      : "";
    const {
      data: { user },
    } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    const isGoogleUser = !!user;

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

    if (body.auth_mode === "authenticated" || isGoogleUser) {
      const guestName =
        (user?.user_metadata?.full_name as string | undefined)?.trim() ||
        (user?.user_metadata?.name as string | undefined)?.trim() ||
        (effectiveEmail.includes("@") ? effectiveEmail.split("@")[0] : "Anonymous");

      const { data: existingRows, error: existingErr } = await supabase
        .from("reviews")
        .select("id, draft, status, visibility, created_at")
        .eq("business_id", business_id)
        .eq("guest_email", effectiveEmail)
        .order("created_at", { ascending: false })
        .limit(25);

      if (existingErr) {
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
      }

      const existingLive = (existingRows ?? []).find((r) => rowIsPublicLiveReview(r));
      if (existingLive?.id) {
        const { error: updateExistingErr } = await supabase
          .from("reviews")
          .update({
            rating: Math.round(ratingNum),
            title: titleVal,
            body: reviewBody,
            date_of_experience,
            status: "published",
            verification_status: "verified",
            user_id: user?.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingLive.id);
        if (updateExistingErr) {
          return NextResponse.json({ error: "update_failed" }, { status: 500 });
        }
        return NextResponse.json({ success: true });
      }

      const { error: insertErr } = await supabase
        .from("reviews")
        .insert({
          business_id,
          guest_email: effectiveEmail,
          guest_name: guestName,
          rating: Math.round(ratingNum),
          title: titleVal,
          body: reviewBody,
          date_of_experience,
          status: "published",
          verification_status: "verified",
          visibility: "visible",
          draft: false,
          imported: false,
          is_flagged: false,
          user_id: user?.id ?? null,
        });
      if (insertErr) {
        const insertCode = (insertErr as { code?: string }).code;
        if (insertCode === "23505") {
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: "update_failed" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

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

    const updatePayload: Record<string, unknown> = {
      rating: Math.round(ratingNum),
      title: titleVal,
      body: reviewBody,
      date_of_experience,
      updated_at: new Date().toISOString(),
    };
    if (isGoogleUser) {
      updatePayload.status = "published";
      updatePayload.verification_status = "verified";
    }

    const { error: updateError } = await supabase
      .from("reviews")
      .update(updatePayload)
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
