import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

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
    console.error("[admin/articles/count] env", e);
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }

  const [{ count: articleCount, error: articleErr }, { count: revisionCount, error: revErr }] =
    await Promise.all([
      admin
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review"),
      admin
        .from("article_revisions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review"),
    ]);

  if (articleErr) {
    console.error("[admin/articles/count] articles", articleErr);
    return NextResponse.json({ error: articleErr.message }, { status: 500 });
  }
  if (revErr) {
    console.error("[admin/articles/count] revisions", revErr);
    return NextResponse.json({ error: revErr.message }, { status: 500 });
  }

  return NextResponse.json({
    pendingCount: (articleCount ?? 0) + (revisionCount ?? 0),
  });
}
