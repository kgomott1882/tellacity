import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

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
    console.error("[admin/business/articles] env", e);
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }

  const { data: articles, error } = await admin
    .from("articles")
    .select(
      "id, business_id, title, slug, content_type, status, excerpt, featured_image_url, submitted_at, published_at, archived_at, status_before_archive, rejection_reason, created_at, updated_at, content, client_industry, challenge, solution, results",
    )
    .eq("business_id", businessId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[admin/business/articles] fetch", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: articles ?? [] });
}
