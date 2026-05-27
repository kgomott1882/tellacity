import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
import {
  FREE_PLAN_PHOTO_FINAL_WARNING_DAYS,
  FREE_PLAN_PHOTO_RETENTION_DAYS,
  expiryCutoffIso,
  finalWarningCutoffIso,
  photoExpiresAtIso,
} from "@/lib/businessPhotoExpiry";

/**
 * GET /api/admin/photo-expiry
 *
 * Returns every free-plan business photo that is already past the 29-day
 * final-warning threshold, grouped by business, together with the owner's
 * email / display name so admins can send the reminder email. Photos that
 * are already past the 30-day retention window (eligible for deletion) are
 * flagged with `isOverdue = true`.
 *
 * Upgrading a business is reflected instantly because plan resolution
 * happens here at query time, any business whose current plan is not
 * `free` is dropped from the response.
 *
 * Admin-only. Uses the service role so the result isn't limited to the
 * caller's RLS view.
 */
export const dynamic = "force-dynamic";

type PhotoRow = {
  id: string;
  business_id: string;
  url: string;
  section: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  moderation_status: string | null;
  is_live: boolean | null;
};

type BusinessRow = {
  id: string;
  name: string | null;
  slug: string | null;
  canonical_slug: string | null;
  owner_id: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
};

type BusinessExpiryEntry = {
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  expiringCount: number;
  overdueCount: number;
  earliestExpiresAt: string | null;
  photos: Array<
    PhotoRow & {
      expiresAt: string | null;
      hoursUntilExpiry: number | null;
      isOverdue: boolean;
    }
  >;
};

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
    console.error("[admin/photo-expiry] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  const now = new Date();
  const warningCutoff = finalWarningCutoffIso(now);

  // Everything ≥ 29 days old, includes both the "final warning" window
  // (29–30d) and any "overdue" photos (≥30d) that are still sitting in the
  // DB. Bounded at 1000 to keep the payload reasonable; admin can re-run
  // the deletion sweep to shrink the set.
  const { data: photos, error: photosErr } = await admin
    .from("business_photos")
    .select(
      "id, business_id, url, section, status, published_at, created_at, moderation_status, is_live"
    )
    .lte("created_at", warningCutoff)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (photosErr) {
    console.error("[admin/photo-expiry] photos", photosErr);
    return NextResponse.json({ error: photosErr.message }, { status: 500 });
  }

  const rows = (photos ?? []) as PhotoRow[];
  if (rows.length === 0) {
    return NextResponse.json({
      expiringCount: 0,
      overdueCount: 0,
      businessCount: 0,
      retentionDays: FREE_PLAN_PHOTO_RETENTION_DAYS,
      warningDays: FREE_PLAN_PHOTO_FINAL_WARNING_DAYS,
      groups: [] as BusinessExpiryEntry[],
    });
  }

  // Gate on plan = free. Businesses that already upgraded fall out here.
  const businessIds = Array.from(new Set(rows.map((r) => r.business_id)));
  let planByBiz = new Map<string, string>();
  try {
    planByBiz = await getActivePlanKeysByBusinessIds(businessIds, admin);
  } catch (e) {
    console.error("[admin/photo-expiry] plan resolve", e);
    return NextResponse.json(
      { error: "Plan resolution failed" },
      { status: 500 }
    );
  }
  const freePhotos = rows.filter(
    (p) => (planByBiz.get(p.business_id) ?? "free") === "free"
  );

  if (freePhotos.length === 0) {
    return NextResponse.json({
      expiringCount: 0,
      overdueCount: 0,
      businessCount: 0,
      retentionDays: FREE_PLAN_PHOTO_RETENTION_DAYS,
      warningDays: FREE_PLAN_PHOTO_FINAL_WARNING_DAYS,
      groups: [] as BusinessExpiryEntry[],
    });
  }

  // Hydrate owner info for every free-plan business in two batched lookups.
  const freeBusinessIds = Array.from(
    new Set(freePhotos.map((p) => p.business_id))
  );
  let businessById = new Map<string, BusinessRow>();
  let profileById = new Map<string, ProfileRow>();

  const { data: bizRows, error: bizErr } = await admin
    .from("businesses")
    .select("id, name, slug, canonical_slug, owner_id")
    .in("id", freeBusinessIds);
  if (bizErr) {
    console.error("[admin/photo-expiry] businesses", bizErr);
  } else {
    businessById = new Map(
      ((bizRows ?? []) as BusinessRow[]).map((b) => [b.id, b])
    );
  }

  const ownerIds = Array.from(
    new Set(
      Array.from(businessById.values())
        .map((b) => b.owner_id)
        .filter((x): x is string => typeof x === "string" && x.length > 0)
    )
  );
  if (ownerIds.length > 0) {
    const { data: profRows, error: profErr } = await admin
      .from("profiles")
      .select("id, email, display_name, full_name")
      .in("id", ownerIds);
    if (profErr) {
      console.error("[admin/photo-expiry] profiles", profErr);
    } else {
      profileById = new Map(
        ((profRows ?? []) as ProfileRow[]).map((p) => [p.id, p])
      );
    }
  }

  const overdueCutoffIso = expiryCutoffIso(now);

  const groupedMap = new Map<string, BusinessExpiryEntry>();
  let totalExpiring = 0;
  let totalOverdue = 0;
  const MS_PER_HOUR = 60 * 60 * 1000;

  for (const photo of freePhotos) {
    const expiresAt = photoExpiresAtIso(photo.created_at);
    const isOverdue =
      typeof photo.created_at === "string" &&
      photo.created_at <= overdueCutoffIso;
    const hoursUntilExpiry = expiresAt
      ? (new Date(expiresAt).getTime() - now.getTime()) / MS_PER_HOUR
      : null;

    if (isOverdue) totalOverdue += 1;
    else totalExpiring += 1;

    const biz = businessById.get(photo.business_id) ?? null;
    const ownerId = biz?.owner_id ?? null;
    const ownerProfile = ownerId ? profileById.get(ownerId) ?? null : null;
    const canonical =
      (biz?.canonical_slug ?? "").trim() || (biz?.slug ?? "").trim() || null;

    const decoratedPhoto = {
      ...photo,
      expiresAt,
      hoursUntilExpiry,
      isOverdue,
    };

    const existing = groupedMap.get(photo.business_id);
    if (existing) {
      existing.photos.push(decoratedPhoto);
      if (isOverdue) existing.overdueCount += 1;
      else existing.expiringCount += 1;
      if (
        expiresAt &&
        (!existing.earliestExpiresAt ||
          expiresAt < existing.earliestExpiresAt)
      ) {
        existing.earliestExpiresAt = expiresAt;
      }
      continue;
    }

    groupedMap.set(photo.business_id, {
      businessId: photo.business_id,
      businessName: biz?.name ?? null,
      businessSlug: canonical,
      ownerId,
      ownerEmail: ownerProfile?.email?.trim() || null,
      ownerName:
        ownerProfile?.display_name?.trim() ||
        ownerProfile?.full_name?.trim() ||
        null,
      expiringCount: isOverdue ? 0 : 1,
      overdueCount: isOverdue ? 1 : 0,
      earliestExpiresAt: expiresAt,
      photos: [decoratedPhoto],
    });
  }

  const groups = Array.from(groupedMap.values()).sort((a, b) => {
    // Soonest-to-expire first, that's what an admin needs to act on.
    const aKey = a.earliestExpiresAt ?? "";
    const bKey = b.earliestExpiresAt ?? "";
    return aKey.localeCompare(bKey);
  });

  return NextResponse.json({
    expiringCount: totalExpiring,
    overdueCount: totalOverdue,
    businessCount: groups.length,
    retentionDays: FREE_PLAN_PHOTO_RETENTION_DAYS,
    warningDays: FREE_PLAN_PHOTO_FINAL_WARNING_DAYS,
    groups,
  });
}
