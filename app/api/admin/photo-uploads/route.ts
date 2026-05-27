import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

/**
 * GET /api/admin/photo-uploads
 *
 * Central review queue for all pending business photo uploads. Returns
 * every photo with `moderation_status = 'pending'` that an owner has
 * published (status='published'), grouped by business, along with the
 * owner's email / display name so the admin can reach out.
 *
 * Only approving or rejecting a photo removes it from this list, merely
 * viewing the page does not.
 *
 * Admin-only. Runs with the service role to bypass per-business RLS.
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
  moderation_reason: string | null;
  is_live: boolean | null;
  is_suspected_collage: boolean | null;
  collage_score: number | null;
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

type BusinessQueueEntry = {
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  pendingCount: number;
  photos: PhotoRow[];
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
    console.error("[admin/photo-uploads] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  // Pull every pending + published photo. Bounded at 500 to keep the page
  // responsive; in practice the queue shouldn't get this deep before an
  // admin acts, but the hard cap keeps the dashboard safe.
  const { data: photos, error: photosErr } = await admin
    .from("business_photos")
    .select(
      "id, business_id, url, section, status, published_at, created_at, moderation_status, moderation_reason, is_live, is_suspected_collage, collage_score"
    )
    .eq("moderation_status", "pending")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(500);

  if (photosErr) {
    console.error("[admin/photo-uploads] photos", photosErr);
    return NextResponse.json({ error: photosErr.message }, { status: 500 });
  }

  const rows = (photos ?? []) as PhotoRow[];

  // Hydrate business + owner info for every referenced business in two
  // batched lookups so the UI can render "Owner: Jane (jane@acme.com)"
  // without additional round-trips.
  const businessIds = Array.from(new Set(rows.map((r) => r.business_id)));
  let businessById = new Map<string, BusinessRow>();
  let profileById = new Map<string, ProfileRow>();

  if (businessIds.length > 0) {
    const { data: bizRows, error: bizErr } = await admin
      .from("businesses")
      .select("id, name, slug, canonical_slug, owner_id")
      .in("id", businessIds);
    if (bizErr) {
      console.error("[admin/photo-uploads] businesses", bizErr);
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
        console.error("[admin/photo-uploads] profiles", profErr);
      } else {
        profileById = new Map(
          ((profRows ?? []) as ProfileRow[]).map((p) => [p.id, p])
        );
      }
    }
  }

  // Group photos under their owning business so the UI can render a
  // section per business, easier for the admin to triage than a flat
  // cross-business grid.
  const groupedMap = new Map<string, BusinessQueueEntry>();
  for (const photo of rows) {
    const biz = businessById.get(photo.business_id) ?? null;
    const ownerId = biz?.owner_id ?? null;
    const ownerProfile = ownerId ? profileById.get(ownerId) ?? null : null;

    const existing = groupedMap.get(photo.business_id);
    if (existing) {
      existing.photos.push(photo);
      existing.pendingCount += 1;
      continue;
    }

    const canonical =
      (biz?.canonical_slug ?? "").trim() ||
      (biz?.slug ?? "").trim() ||
      null;

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
      pendingCount: 1,
      photos: [photo],
    });
  }

  const groups = Array.from(groupedMap.values()).sort((a, b) => {
    // Newest upload across each business bubbles its group to the top.
    const aNewest = a.photos[0]?.created_at ?? "";
    const bNewest = b.photos[0]?.created_at ?? "";
    return bNewest.localeCompare(aNewest);
  });

  const totalPending = rows.length;

  return NextResponse.json({
    pendingCount: totalPending,
    businessCount: groups.length,
    groups,
  });
}
