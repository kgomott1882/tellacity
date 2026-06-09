import { NextResponse } from "next/server";

export const ARTICLE_MEDIA_PUBLIC_MARKER =
  "/storage/v1/object/public/article_media/" as const;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
