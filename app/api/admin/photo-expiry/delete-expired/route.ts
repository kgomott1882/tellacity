import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import { expiryCutoffIso } from "@/lib/businessPhotoExpiry";

/**
 * POST /api/admin/photo-expiry/delete-expired
 *
 * Hard-deletes every free-plan business photo that has crossed the 30-day
 * retention window. Matches the per-photo admin delete endpoint's behavior:
 *
 *   - DB row is removed (pulls the photo off the public page, the business
 *     dashboard, and the admin review queue; frees up a plan slot since
 *     the cap is an INSERT-time check).
 *   - Best-effort cleanup of the backing object in the `business_media`
 *     storage bucket. A storage-cleanup failure is logged but does not
 *     fail the request, the DB is the source of truth for visibility.
 *
 * Upgraded businesses are skipped, plan resolution happens here at call
 * time, so re-subscribing before the sweep preserves the photos.
 *
 * Auth, one of:
 *   - An authenticated admin user (cookie session with `profiles.is_admin`).
 *   - `Authorization: Bearer <PHOTO_EXPIRY_CRON_SECRET>` for automated
 *     scheduled jobs (Vercel cron, GitHub Actions, etc.). When the env var
 *     is unset this bearer path is disabled.
 *
 * Body (optional JSON): { dryRun?: boolean }
 *   - dryRun=true returns the set that would be deleted without touching
 *     anything. Useful for verifying the sweep before enabling the cron.
 */
export const dynamic = "force-dynamic";

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/business_media/" as const;

function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const idx = url.indexOf(STORAGE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  const raw = url.slice(idx + STORAGE_PUBLIC_PREFIX.length);
  const withoutQuery = raw.split("?")[0] ?? raw;
  try {
    return decodeURIComponent(withoutQuery);
  } catch {
    return withoutQuery;
  }
}

async function authorize(
  req: Request
): Promise<
  | { ok: true; via: "admin" | "cron" }
  | { ok: false; response: NextResponse }
> {
  // 1) Bearer cron secret (if configured).
  const cronSecret = process.env.PHOTO_EXPIRY_CRON_SECRET?.trim();
  if (cronSecret) {
    const authHeader = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${cronSecret}`;
    if (authHeader === expected) return { ok: true, via: "cron" };
  }

  // 2) Admin cookie session.
  const userClient = await createSupabaseServerCookies();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  const { data: profile } = await userClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin !== true) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, via: "admin" };
}

export async function POST(req: Request) {
  const gate = await authorize(req);
  if (!gate.ok) return gate.response;

  let dryRun = false;
  try {
    const raw = await req.text();
    if (raw) {
      const parsed = JSON.parse(raw) as { dryRun?: unknown };
      dryRun = parsed?.dryRun === true;
    }
  } catch {
    // Empty / invalid body is fine, treat as non-dry-run sweep.
  }

  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/photo-expiry/delete-expired] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  const now = new Date();
  const cutoff = expiryCutoffIso(now);

  const { data: candidates, error: rowsErr } = await admin
    .from("business_photos")
    .select("id, business_id, url, created_at")
    .lte("created_at", cutoff)
    .limit(1000);

  if (rowsErr) {
    console.error("[admin/photo-expiry/delete-expired] rows", rowsErr);
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  const rows = candidates ?? [];
  if (rows.length === 0) {
    return NextResponse.json({
      ok: true,
      dryRun,
      scanned: 0,
      eligible: 0,
      deleted: 0,
      storageCleanedUp: 0,
      storageFailed: 0,
      skippedPaidPlan: 0,
    });
  }

  // Only free-plan businesses are in scope.
  const businessIds = Array.from(
    new Set(
      rows
        .map((r) => r.business_id as string | null)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );
  let planByBiz = new Map<string, string>();
  try {
    planByBiz = await getActivePlanKeysByBusinessIds(businessIds, admin);
  } catch (e) {
    console.error("[admin/photo-expiry/delete-expired] plan resolve", e);
    return NextResponse.json(
      { error: "Plan resolution failed" },
      { status: 500 }
    );
  }

  const eligible = rows.filter(
    (r) => (planByBiz.get(r.business_id as string) ?? "free") === "free"
  );
  const skippedPaidPlan = rows.length - eligible.length;

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      scanned: rows.length,
      eligible: eligible.length,
      deleted: 0,
      storageCleanedUp: 0,
      storageFailed: 0,
      skippedPaidPlan,
      samplePhotoIds: eligible.slice(0, 20).map((r) => r.id),
    });
  }

  let deleted = 0;
  let storageCleanedUp = 0;
  let storageFailed = 0;
  const failedPhotoIds: string[] = [];

  // Delete sequentially, volumes are tiny and this keeps the storage
  // cleanup ordering predictable. If this ever grows, batch the DB delete
  // with `.in("id", idsChunk)` and then fan out the storage removes.
  for (const row of eligible) {
    const { error: delErr } = await admin
      .from("business_photos")
      .delete()
      .eq("id", row.id)
      .eq("business_id", row.business_id);
    if (delErr) {
      console.error(
        "[admin/photo-expiry/delete-expired] row delete",
        row.id,
        delErr
      );
      failedPhotoIds.push(row.id);
      continue;
    }
    deleted += 1;

    const storagePath = extractStoragePath(row.url as string | null | undefined);
    if (!storagePath) continue;
    try {
      const { error: storageErr } = await admin.storage
        .from("business_media")
        .remove([storagePath]);
      if (storageErr) {
        storageFailed += 1;
        console.error(
          "[admin/photo-expiry/delete-expired] storage remove",
          storageErr,
          storagePath
        );
      } else {
        storageCleanedUp += 1;
      }
    } catch (e) {
      storageFailed += 1;
      console.error(
        "[admin/photo-expiry/delete-expired] storage exception",
        e
      );
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun: false,
    via: gate.via,
    scanned: rows.length,
    eligible: eligible.length,
    deleted,
    storageCleanedUp,
    storageFailed,
    skippedPaidPlan,
    failedPhotoIds,
  });
}

/** GET returns what a dry run would do, safe read-only probe. */
export async function GET(req: Request) {
  const gate = await authorize(req);
  if (!gate.ok) return gate.response;

  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/photo-expiry/delete-expired GET] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  const cutoff = expiryCutoffIso(new Date());
  const { data: candidates, error } = await admin
    .from("business_photos")
    .select("id, business_id, created_at")
    .lte("created_at", cutoff)
    .limit(1000);
  if (error) {
    console.error("[admin/photo-expiry/delete-expired GET] rows", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = candidates ?? [];

  const businessIds = Array.from(
    new Set(
      rows
        .map((r) => r.business_id as string | null)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );
  let planByBiz = new Map<string, string>();
  try {
    planByBiz = await getActivePlanKeysByBusinessIds(businessIds, admin);
  } catch (e) {
    console.error("[admin/photo-expiry/delete-expired GET] plan", e);
    return NextResponse.json(
      { error: "Plan resolution failed" },
      { status: 500 }
    );
  }
  const eligible = rows.filter(
    (r) => (planByBiz.get(r.business_id as string) ?? "free") === "free"
  );

  return NextResponse.json({
    ok: true,
    cutoffIso: cutoff,
    scanned: rows.length,
    eligible: eligible.length,
    skippedPaidPlan: rows.length - eligible.length,
  });
}
