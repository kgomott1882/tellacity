import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";

/**
 * Business profile row for settings UI (same columns as client used to select).
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const fullCols =
      "id,name,website,website_display,description,address,city,country_code,phone,email,logo_url,tags,reference_number_enabled,reference_number_type,reference_number_label_custom";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    let { data: row, error } = await ctx.db.from("businesses").select(fullCols).eq("id", businessId).single();
    data = row;

    const colMissing =
      error &&
      (String((error as { code?: string }).code) === "PGRST204" ||
        String((error as { code?: string }).code) === "42703" ||
        String((error as { message?: string }).message ?? "")
          .toLowerCase()
          .includes("does not exist"));

    if (colMissing) {
      const fallback = await ctx.db
        .from("businesses")
        .select("id,name,website,description,address,city,country_code,tags")
        .eq("id", businessId)
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error("[business-profile GET]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ business: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[business-profile GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
