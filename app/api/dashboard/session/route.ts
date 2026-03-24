import { NextResponse } from "next/server";
import { resolveDashboardDb } from "@/lib/supabase/businessDashboardServer";

/** Lightweight session read for dashboard UI (email for checkout, etc.). Cookie-first; same auth as other dashboard APIs. */
export async function GET(req: Request) {
  try {
    const ctx = await resolveDashboardDb(req);
    if (!ctx.ok) return ctx.response;
    return NextResponse.json(
      { email: ctx.email },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[dashboard/session]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
