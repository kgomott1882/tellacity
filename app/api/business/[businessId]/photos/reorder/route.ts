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

function parseOrderedIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out: string[] = [];
  for (const x of raw) {
    const id = parseUuid(x);
    if (!id) return null;
    out.push(id);
  }
  return out;
}

/**
 * POST — assign `sort_order` for all photos in a section from client order.
 * Body: { section: string, orderedIds: string[] } (uuid[], permutation of rows in that section).
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
    const section = sanitizeSectionSlug(body?.section);
    const orderedIds = parseOrderedIds(body?.orderedIds);
    if (!section || !orderedIds || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "section and orderedIds (non-empty uuid array) are required." },
        { status: 400 }
      );
    }

    const { data: rows, error: listErr } = await ctx.db
      .from("business_photos")
      .select("id")
      .eq("business_id", businessId)
      .eq("section", section);
    if (listErr) {
      return NextResponse.json({ error: listErr.message }, { status: 500 });
    }
    const existing = new Set((rows ?? []).map((r: { id: string }) => r.id));
    if (orderedIds.length !== existing.size) {
      return NextResponse.json(
        { error: "orderedIds must list every photo in this section exactly once." },
        { status: 400 }
      );
    }
    for (const id of orderedIds) {
      if (!existing.has(id)) {
        return NextResponse.json(
          { error: "orderedIds must list every photo in this section exactly once." },
          { status: 400 }
        );
      }
    }

    const updates = orderedIds.map((id, index) =>
      ctx.db
        .from("business_photos")
        .update({ sort_order: (index + 1) * 10 })
        .eq("id", id)
        .eq("business_id", businessId)
        .eq("section", section)
    );
    const results = await Promise.all(updates);
    const firstErr = results.find((r) => r.error)?.error;
    if (firstErr) {
      return NextResponse.json({ error: firstErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("[photos reorder POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
