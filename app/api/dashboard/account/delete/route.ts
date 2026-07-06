export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ownerDeleteBusinessAccount } from "@/lib/ownerDeleteBusinessAccount";
import { resolveDashboardDb } from "@/lib/supabase/businessDashboardServer";

export async function POST(req: Request) {
  try {
    const ctx = await resolveDashboardDb(req);
    if (!ctx.ok) return ctx.response;

    const {
      data: { user },
      error: authErr,
    } = await ctx.db.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { confirm?: boolean };
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: "Confirmation required. Set confirm: true." },
        { status: 400 },
      );
    }

    const md = (user.user_metadata ?? {}) as Record<string, unknown>;
    const ownerName =
      (typeof md.display_name === "string" ? md.display_name.trim() : "") ||
      (typeof md.full_name === "string" ? md.full_name.trim() : "") ||
      undefined;

    const result = await ownerDeleteBusinessAccount({
      ownerUserId: user.id,
      email: user.email ?? "",
      ownerName,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      deletedBusinessIds: result.deletedBusinessIds,
      confirmationEmailSent: result.confirmationEmailSent,
    });
  } catch (e) {
    console.error("[dashboard/account/delete]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
