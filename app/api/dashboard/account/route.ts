import { NextResponse } from "next/server";
import { resolveDashboardDb } from "@/lib/supabase/businessDashboardServer";

/** Account form data from server session (cookies / Bearer) — avoids client getSession() races. */
export async function GET(req: Request) {
  try {
    const ctx = await resolveDashboardDb(req);
    if (!ctx.ok) return ctx.response;

    const { data: userData, error: authErr } = await ctx.db.auth.getUser();
    if (authErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const u = userData.user;

    const { data: bp } = await ctx.db
      .from("business_profiles")
      .select("business_name")
      .eq("id", u.id)
      .maybeSingle();

    const displayName = (u.user_metadata?.display_name as string | undefined)?.trim() ?? "";
    let name = displayName;
    const bpName = bp && typeof bp === "object" && "business_name" in bp ? (bp as { business_name: string | null }).business_name : null;
    if (!name && bpName) name = String(bpName).trim();

    return NextResponse.json(
      {
        userId: u.id,
        email: u.email ?? "",
        name,
        country: (u.user_metadata?.country as string | undefined) ?? null,
        language: (u.user_metadata?.language as string | undefined) ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[dashboard/account]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
