export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be 5 MB or smaller" }, { status: 400 });
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `platform/${auth.userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await auth.admin.storage
    .from("article_media")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadErr) {
    console.error("[admin/platform-articles/upload]", uploadErr);
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: pub } = auth.admin.storage.from("article_media").getPublicUrl(path);
  const url = pub?.publicUrl ?? "";
  if (!url) {
    return NextResponse.json({ error: "Failed to resolve public URL" }, { status: 500 });
  }

  return NextResponse.json({ url, storagePath: path }, { status: 201 });
}
