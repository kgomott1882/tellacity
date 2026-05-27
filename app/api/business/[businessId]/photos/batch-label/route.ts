export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

function sanitizeSectionSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.toLowerCase().trim();
}

function parseUuid(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const re =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return re.test(s) ? s : null;
}

/**
 * POST, set upload_batch_label for drafts that share upload_batch_id.
 * Body: { uploadBatchId: string, section: string }
 * Label is "{Section title} batch" from business_photo_sections.title.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const uploadBatchId = parseUuid(body?.uploadBatchId);
    const section = sanitizeSectionSlug(body?.section);
    if (!uploadBatchId || !section) {
      return NextResponse.json(
        { error: "uploadBatchId (uuid) and section are required." },
        { status: 400 }
      );
    }

    const { data: sec, error: secErr } = await ctx.db
      .from("business_photo_sections")
      .select("title")
      .eq("business_id", businessId)
      .eq("slug", section)
      .maybeSingle();

    if (secErr) {
      console.error("[photos/batch-label] section", secErr.message);
      return NextResponse.json({ error: "Could not load section." }, { status: 500 });
    }

    const title = String((sec as { title?: string } | null)?.title ?? "").trim() || section;
    const label = `${title} batch`;

    const { data: updated, error } = await ctx.db
      .from("business_photos")
      .update({ upload_batch_label: label })
      .eq("business_id", businessId)
      .eq("status", "draft")
      .eq("section", section)
      .eq("upload_batch_id", uploadBatchId)
      .is("upload_batch_label", null)
      .select("id");

    if (error) {
      console.error("[photos/batch-label] update", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const count = Array.isArray(updated) ? updated.length : 0;
    return NextResponse.json({ ok: true, labeledCount: count, uploadBatchLabel: label }, { status: 200 });
  } catch (e) {
    console.error("[photos/batch-label]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
