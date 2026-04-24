import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

/**
 * DELETE /api/admin/businesses/:businessId/photos/:photoId
 *
 * Hard-deletes a business photo from the admin console. Used both in the
 * per-business admin photos tab and the global Photo Uploads queue.
 *
 *   - Removes the row from `business_photos`, which instantly:
 *       • pulls the photo off the public page (status/is_live filters),
 *       • removes it from the business dashboard grid,
 *       • removes it from the admin review queue,
 *       • frees a slot under the business's per-plan photo cap (the
 *         cap is an INSERT-time trigger + API check; there's no counter
 *         table to decrement).
 *   - Best-effort cleanup of the underlying object in the
 *     `business_media` storage bucket so we don't leak blobs. A failure
 *     to delete the blob does NOT fail the request — the DB row is the
 *     source of truth for visibility.
 *
 * Admin-only. Bypasses the Free-plan 30-day edit lock because this is an
 * admin override, not an owner action.
 */
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/business_media/" as const;

type RouteParams = {
  params: Promise<{ businessId: string; photoId: string }>;
};

/**
 * Parse a public Supabase storage URL for the `business_media` bucket and
 * return the object path (e.g. `<businessId>/<timestamp>-<filename>.jpg`)
 * that `.storage.from('business_media').remove([...])` expects. Returns
 * null for malformed URLs.
 */
function extractStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const idx = url.indexOf(STORAGE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  const raw = url.slice(idx + STORAGE_PUBLIC_PREFIX.length);
  // Strip query string and unescape.
  const withoutQuery = raw.split("?")[0] ?? raw;
  try {
    return decodeURIComponent(withoutQuery);
  } catch {
    return withoutQuery;
  }
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  const { businessId, photoId } = await ctx.params;
  if (!UUID_RE.test(String(businessId ?? ""))) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }
  if (!UUID_RE.test(String(photoId ?? ""))) {
    return NextResponse.json({ error: "Invalid photoId" }, { status: 400 });
  }

  // --- admin auth gate -----------------------------------------------------
  const userClient = await createSupabaseServerCookies();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // --- service client (bypasses RLS) --------------------------------------
  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/photos DELETE] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  // --- fetch the photo (to grab the storage URL before we delete) ----------
  const { data: photo, error: fetchErr } = await admin
    .from("business_photos")
    .select("id, business_id, url")
    .eq("id", photoId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/photos DELETE] fetch", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!photo) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  // --- delete the DB row (single source of truth for visibility) ----------
  const { error: delErr } = await admin
    .from("business_photos")
    .delete()
    .eq("id", photoId)
    .eq("business_id", businessId);

  if (delErr) {
    console.error("[admin/photos DELETE] row", delErr);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  // --- best-effort storage cleanup ----------------------------------------
  // A failure here must not fail the request — the visible state is
  // already correct (row gone, caps freed). Log so we can reconcile.
  let storagePath: string | null = null;
  let storageCleanup: "ok" | "skipped" | "failed" = "skipped";
  try {
    storagePath = extractStoragePath(photo.url);
    if (storagePath) {
      const { error: storageErr } = await admin.storage
        .from("business_media")
        .remove([storagePath]);
      if (storageErr) {
        storageCleanup = "failed";
        console.error(
          "[admin/photos DELETE] storage remove",
          storageErr,
          storagePath
        );
      } else {
        storageCleanup = "ok";
      }
    }
  } catch (e) {
    storageCleanup = "failed";
    console.error("[admin/photos DELETE] storage exception", e);
  }

  return NextResponse.json({
    ok: true,
    deletedId: photoId,
    storagePath,
    storageCleanup,
  });
}
