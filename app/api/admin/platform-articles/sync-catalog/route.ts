export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/requireAdminApi";
import { syncTellacityCatalogToPlatformArticles } from "@/lib/platformArticles/syncCatalog";

export async function POST() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const result = await syncTellacityCatalogToPlatformArticles(auth.admin);
  if (result.errors.length > 0 && result.inserted === 0) {
    return NextResponse.json(
      { error: result.errors[0], ...result },
      { status: 500 },
    );
  }

  return NextResponse.json(result);
}
