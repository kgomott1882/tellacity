export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { getServerEnv } from "@/lib/serverEnv";

const LOGO_BUCKET = "business_logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/**
 * Upload business logo via service role (avoids client storage RLS / upsert issues).
 * Body: multipart form with field `file`.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const formData = await req.formData().catch(() => null);
    const file = formData?.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Please choose an image file." },
        { status: 400 },
      );
    }

    const contentType = (file.type || "image/jpeg").toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Logo must be a JPG, PNG, or WebP image." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Logo must be under 2 MB." },
        { status: 400 },
      );
    }

    const ext = extForMime(contentType);
    const path = `${businessId}/logo.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { error: uploadError } = await admin.storage
      .from(LOGO_BUCKET)
      .upload(path, bytes, { upsert: true, contentType });

    if (uploadError) {
      console.error("[business/logo] storage upload:", uploadError.message);
      return NextResponse.json(
        {
          error:
            "We couldn't upload your logo right now. Please try again in a moment.",
        },
        { status: 500 },
      );
    }

    const { data: urlData } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);
    const baseUrl = urlData?.publicUrl?.trim();
    if (!baseUrl) {
      return NextResponse.json(
        {
          error:
            "We couldn't save your logo right now. Please try again in a moment.",
        },
        { status: 500 },
      );
    }

    const publicUrl = `${baseUrl}?v=${Date.now()}`;

    const { error: updateError } = await ctx.db
      .from("businesses")
      .update({ logo_url: publicUrl })
      .eq("id", businessId);

    if (updateError) {
      console.error("[business/logo] businesses update:", updateError.message);
      return NextResponse.json(
        {
          error:
            "Your logo was uploaded but we couldn't update your profile. Please try again.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ logoUrl: publicUrl });
  } catch (e) {
    console.error("[business/logo]", e);
    return NextResponse.json(
      {
        error:
          "We couldn't upload your logo right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
