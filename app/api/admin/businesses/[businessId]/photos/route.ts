import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

/**
 * GET /api/admin/businesses/:businessId/photos
 *
 * Returns every photo for the business (any moderation_status, any publish
 * status) along with the owner's email + display name so the admin UI can
 * render a review queue without a second round-trip.
 *
 * Requires profiles.is_admin = true. Reads go through the service role to
 * bypass RLS — admins must see photos regardless of ownership or moderation
 * state.
 */
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { businessId } = await ctx.params;
  if (!UUID_RE.test(String(businessId ?? ""))) {
    return NextResponse.json({ error: "Invalid businessId" }, { status: 400 });
  }

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
    console.error("[admin/photos] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  const { data: photos, error: photosErr } = await admin
    .from("business_photos")
    .select(
      "id, business_id, url, section, status, published_at, created_at, moderation_status, moderation_reason, is_live, is_suspected_collage, collage_score, moderated_at, moderated_by"
    )
    .eq("business_id", businessId)
    .order("moderation_status", { ascending: true })
    .order("created_at", { ascending: false });

  if (photosErr) {
    console.error("[admin/photos] fetch", photosErr);
    return NextResponse.json({ error: photosErr.message }, { status: 500 });
  }

  const { data: business } = await admin
    .from("businesses")
    .select("id, name, owner_id")
    .eq("id", businessId)
    .maybeSingle();

  let ownerEmail: string | null = null;
  let ownerName: string | null = null;
  if (business?.owner_id) {
    const { data: owner } = await admin
      .from("profiles")
      .select("email, display_name, full_name")
      .eq("id", business.owner_id)
      .maybeSingle();
    const ownerRow = owner as
      | { email?: string | null; display_name?: string | null; full_name?: string | null }
      | null;
    ownerEmail = ownerRow?.email?.trim() || null;
    ownerName =
      ownerRow?.display_name?.trim() ||
      ownerRow?.full_name?.trim() ||
      null;
  }

  return NextResponse.json({
    businessId,
    businessName: business?.name ?? null,
    ownerId: business?.owner_id ?? null,
    ownerEmail,
    ownerName,
    photos: photos ?? [],
  });
}
