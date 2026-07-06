export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  sanitizeAdminBusinessSearchToken,
  type AdminBusinessSearchRow,
} from "@/lib/admin/adminBusinessSearch";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const q = sanitizeAdminBusinessSearchToken(url.searchParams.get("q") ?? "");
  if (q.length < 1) {
    return NextResponse.json({ results: [] as AdminBusinessSearchRow[] });
  }

  const { data, error } = await auth.admin
    .from("businesses")
    .select(
      "id, name, slug, website, website_display, country_code, primary_group_slug, category_slug, address, city, phone, email, status, owner_id, is_claimed",
    )
    .or(`name.ilike.%${q}%,website_display.ilike.%${q}%,website.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    return NextResponse.json({ error: error.message, results: [] }, { status: 500 });
  }

  return NextResponse.json({
    results: (Array.isArray(data) ? data : []) as AdminBusinessSearchRow[],
  });
}
