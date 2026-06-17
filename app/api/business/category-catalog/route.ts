export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { loadCategoryCatalog } from "@/lib/categoryCatalogServer";

/**
 * Public taxonomy for forms (suggest-business, dashboard onboarding, post-signup).
 * Same rules as app/suggest-business/page.tsx: only groups that have ≥1 category.
 */
export async function GET() {
  try {
    const result = await loadCategoryCatalog();
    if ("error" in result) {
      console.error("category-catalog:", result.error);
      return NextResponse.json({ error: "catalog_load_failed" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("category-catalog:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
