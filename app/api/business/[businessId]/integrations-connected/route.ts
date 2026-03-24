import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { data, error } = await ctx.db
      .from("business_integrations_v1")
      .select("provider")
      .eq("business_id", businessId);

    if (error) {
      console.error("[integrations-connected]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const providers = (data ?? []).map((r) => String(r.provider ?? ""));

    return NextResponse.json(
      { providers },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[integrations-connected]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
