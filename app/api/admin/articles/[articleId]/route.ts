import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteParams = { params: Promise<{ articleId: string }> };

export async function DELETE(_req: Request, ctx: RouteParams) {
  const { articleId } = await ctx.params;
  if (!UUID_RE.test(String(articleId ?? ""))) {
    return NextResponse.json({ error: "Invalid articleId" }, { status: 400 });
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
    console.error("[admin/articles/delete] env", e);
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }

  const { data: existing, error: fetchErr } = await admin
    .from("articles")
    .select("id, status")
    .eq("id", articleId)
    .maybeSingle();

  if (fetchErr) {
    console.error("[admin/articles/delete] fetch", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  if (String(existing.status) !== "archived") {
    return NextResponse.json(
      { error: "Only archived articles can be permanently deleted." },
      { status: 409 },
    );
  }

  const { error: delErr } = await admin.from("articles").delete().eq("id", articleId);

  if (delErr) {
    console.error("[admin/articles/delete]", delErr);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
