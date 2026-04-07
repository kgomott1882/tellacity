export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { notifyBusinessOwnerOfNewReview } from "@/lib/notifyBusinessOwnerNewReview";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!serviceRoleKey || auth !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { business_id?: string; review_id?: string; rating?: number };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const businessId =
    typeof body.business_id === "string" ? body.business_id.trim() : "";
  const reviewId =
    typeof body.review_id === "string" ? body.review_id.trim() : "";
  const rating = Number(body.rating);

  if (!businessId || !reviewId || !Number.isFinite(rating)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await notifyBusinessOwnerOfNewReview({
    businessId,
    reviewId,
    rating,
  });

  return NextResponse.json({ success: true });
}
