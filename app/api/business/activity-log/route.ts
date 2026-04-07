import { NextResponse } from "next/server";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import {
  canAccessBusiness,
  resolveDashboardDb,
} from "@/lib/supabase/businessDashboardServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "";
    const metadata =
      body.metadata && typeof body.metadata === "object" && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : {};

    if (!businessId || !action) {
      return NextResponse.json({ error: "Invalid body." }, { status: 400 });
    }

    const auth = await resolveDashboardDb(req);
    if (!auth.ok) return auth.response;

    const allowed = await canAccessBusiness(auth.db, auth.userId, businessId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    await logBusinessActivity({
      businessId,
      userId: auth.userId,
      action,
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[activity-log]", err);
    return NextResponse.json({ ok: true });
  }
}
