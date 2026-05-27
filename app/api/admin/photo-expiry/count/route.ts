import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import {
  expiryCutoffIso,
  finalWarningCutoffIso,
} from "@/lib/businessPhotoExpiry";

/**
 * GET /api/admin/photo-expiry/count
 *
 * Returns the number of business photos that are currently in the "final
 * 24 hour warning" window, uploaded by a business whose resolved plan is
 * `free` and that crossed the 29-day retention threshold but hasn't yet
 * hit the 30-day deletion cutoff.
 *
 * Drives the "Photo Expiry" notification badge in the admin sidebar. The
 * badge clears itself naturally once an admin sends the reminders and the
 * retention cron (or the admin's "delete expired now" action) sweeps the
 * photos.
 *
 * Admin-only. Uses the service role so the count isn't scoped to the
 * caller's RLS view of other businesses' photos.
 */
export const dynamic = "force-dynamic";

export async function GET() {
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

  let admin;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error("[admin/photo-expiry/count] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  const now = new Date();
  const warningCutoff = finalWarningCutoffIso(now); // created_at <= this → ≥29d old
  const hardExpiryCutoff = expiryCutoffIso(now); // created_at <= this → ≥30d old

  // Pull photos in the warning window ([29d, 30d)). We grab business_id so
  // we can gate on the current plan key in a second pass, doing the plan
  // filter here (instead of SQL) keeps this endpoint in sync with the
  // shared plan-resolution helper.
  const { data: rows, error: rowsErr } = await admin
    .from("business_photos")
    .select("id, business_id, created_at")
    .lte("created_at", warningCutoff)
    .gt("created_at", hardExpiryCutoff);

  if (rowsErr) {
    console.error("[admin/photo-expiry/count]", rowsErr);
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });
  }

  const candidates = rows ?? [];
  if (candidates.length === 0) {
    return NextResponse.json({ expiringCount: 0, businessCount: 0 });
  }

  const businessIds = Array.from(
    new Set(
      candidates
        .map((r) => r.business_id as string | null)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    )
  );

  let planByBiz = new Map<string, string>();
  try {
    planByBiz = await getActivePlanKeysByBusinessIds(businessIds, admin);
  } catch (e) {
    console.error("[admin/photo-expiry/count] plan resolve", e);
    return NextResponse.json(
      { error: "Plan resolution failed" },
      { status: 500 }
    );
  }

  let expiringCount = 0;
  const businessesWithExpiring = new Set<string>();
  for (const row of candidates) {
    const bid = row.business_id as string | null;
    if (!bid) continue;
    if ((planByBiz.get(bid) ?? "free") !== "free") continue;
    expiringCount += 1;
    businessesWithExpiring.add(bid);
  }

  return NextResponse.json({
    expiringCount,
    businessCount: businessesWithExpiring.size,
  });
}
