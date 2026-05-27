export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { computePublishLockStatus } from "@/lib/businessPhotoLock";

async function countPublished(
  db: { from: (t: string) => unknown },
  businessId: string
): Promise<number> {
  const builder = db.from("business_photos") as unknown as {
    select: (c: string, opts: { count: "exact"; head: true }) => {
      eq: (k: string, v: unknown) => {
        eq: (k: string, v: unknown) => Promise<{ count: number | null }>;
      };
    };
  };
  const { count } = await builder
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "published");
  return count ?? 0;
}

/** Most recent published_at across a business's published photos, or null. */
async function getLastPublishedAt(
  db: { from: (t: string) => unknown },
  businessId: string
): Promise<string | null> {
  const builder = db.from("business_photos") as unknown as {
    select: (c: string) => {
      eq: (k: string, v: unknown) => {
        eq: (k: string, v: unknown) => {
          order: (
            col: string,
            opts: { ascending: boolean }
          ) => {
            limit: (n: number) => Promise<{
              data: Array<{ published_at: string | null }> | null;
            }>;
          };
        };
      };
    };
  };
  const { data } = await builder
    .select("published_at")
    .eq("business_id", businessId)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1);
  return Array.isArray(data) && data[0]?.published_at
    ? String(data[0].published_at)
    : null;
}

/** GET, returns the lock state, last-publish timestamp, and draft count. */
export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";

    const [publishedCount, lastPublishedAt] = await Promise.all([
      countPublished(ctx.db, businessId),
      getLastPublishedAt(ctx.db, businessId),
    ]);
    const lock = computePublishLockStatus(planKey, lastPublishedAt);

    const { count: draftCount } = await ctx.db
      .from("business_photos")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "draft");

    return NextResponse.json(
      {
        lock,
        draftCount: draftCount ?? 0,
        publishedCount,
        planKey,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[photos/publish GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST, publish all current drafts for this business.
 *
 * Publishing is no longer gated by a business-wide 30-day cooldown, as
 * long as the business is under its per-plan photo cap (enforced in the
 * upload route + DB trigger), any fresh drafts can be pushed live. The
 * Free-plan 30-day lock now applies only to editing / deleting *existing
 * published* photos (see isPhotoEditLocked in the per-photo route).
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as { sectionSlug?: unknown } | null;
    const sectionSlug =
      typeof body?.sectionSlug === "string" ? body.sectionSlug.trim().toLowerCase() : "";

    const planByBiz = await getActivePlanKeysByBusinessIds([businessId], ctx.db);
    const planKey = planByBiz.get(businessId) ?? "free";

    const nowIso = new Date().toISOString();
    let q = ctx.db
      .from("business_photos")
      .update({ status: "published", published_at: nowIso })
      .eq("business_id", businessId)
      .eq("status", "draft");
    if (sectionSlug) {
      q = q.eq("section", sectionSlug);
    }
    const { data: published, error } = await q.select("id");

    if (error) {
      console.error(
        "[photos/publish POST]",
        JSON.stringify(
          {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
          null,
          2
        )
      );
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const publishedCount = published?.length ?? 0;
    const lastPublishedAt = await getLastPublishedAt(ctx.db, businessId);
    const lock = computePublishLockStatus(planKey, lastPublishedAt);

    return NextResponse.json(
      { publishedCount, lock, planKey },
      { status: 200 }
    );
  } catch (e) {
    console.error("[photos/publish POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
