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
      "id,name,website,website_display,description,address,city,country_code,phone,email,logo_url,tags,reference_number_enabled,reference_number_type,reference_number_label_custom,product_buy_url";

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

function normalizeExternalUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t.slice(0, 2000);
  return `https://${t}`.slice(0, 2000);
}

/**
 * PATCH — partial update (currently product_buy_url for storefront link).
 */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => null)) as { product_buy_url?: unknown } | null;
    if (!body || !("product_buy_url" in body)) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const product_buy_url = normalizeExternalUrl(body.product_buy_url);

    const { error } = await ctx.db
      .from("businesses")
      .update({ product_buy_url })
      .eq("id", businessId);

    if (error) {
      const missing =
        String((error as { code?: string }).code) === "42703" ||
        String((error as { message?: string }).message ?? "")
          .toLowerCase()
          .includes("product_buy_url");
      if (missing) {
        return NextResponse.json(
          {
            error:
              "Column product_buy_url is missing. Run the latest Supabase migration for businesses.product_buy_url.",
            code: "PRODUCT_BUY_URL_MISSING",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, product_buy_url }, { status: 200 });
  } catch (e) {
    console.error("[business-profile PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
