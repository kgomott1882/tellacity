import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

/**
 * GET /api/admin/photo-uploads/count
 *
 * Returns the number of photos across the platform that are still awaiting
 * a final admin decision (moderation_status = 'pending'). The admin
 * sidebar polls this endpoint so the "Photo Uploads" tab can show an
 * active notification badge that only clears once every pending photo has
 * been approved or rejected, viewing the queue doesn't reset it.
 *
 * Admin-only. Uses the service role so the count isn't limited by the
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
    console.error("[admin/photo-uploads/count] env", e);
    return NextResponse.json(
      { error: "Service role misconfigured" },
      { status: 500 }
    );
  }

  const { count, error } = await admin
    .from("business_photos")
    .select("id", { count: "exact", head: true })
    .eq("moderation_status", "pending")
    .eq("status", "published");

  if (error) {
    console.error("[admin/photo-uploads/count]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pendingCount: count ?? 0 });
}
